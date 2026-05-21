from types import SimpleNamespace

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ai_engine import (
    CAPABILITIES_DATA,
    CAPABILITIES_HELP_STRING,
    build_history_string,
    build_member_list_string,
    build_my_assigned_string,
    build_overdue_string,
    build_project_list_string,
    build_stats_string,
    build_task_list_string,
    call_openai,
)
from auth import get_current_user
from crud import (
    add_project_member_by_email,
    create_chat_message,
    create_project,
    create_task,
    delete_project,
    delete_task,
    get_all_tasks,
    get_chat_history,
    get_project_by_id,
    get_task_history,
    get_tasks_assigned_to_user,
    get_user_role_in_project,
    list_project_members,
    list_projects,
    remove_project_member,
    update_project,
    update_task,
)
from database import get_db
from models import Project, ProjectMember, User
from schemas import (
    CapabilitiesResponse,
    CapabilityExample,
    CapabilityItem,
    ChatMessageResponse,
    ChatRequest,
    ChatResponse,
    ProjectCreate,
    ProjectMemberResponse,
    ProjectResponse,
    ProjectUpdate,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)

router = APIRouter()


# Actions that don't mutate state and don't need any DB call from this route —
# the AI's `reply` already contains the user-facing answer because the model
# was given the data via the system prompt.
READ_ONLY_ACTIONS = {
    "FOCUS",
    "SUMMARY",
    "SHOW_OVERDUE",
    "SHOW_MY_TASKS",
    "SHOW_HISTORY",
    "SEARCH",
    "LIST_MEMBERS",
    "LIST_PROJECTS",
    "HELP",
    "CLARIFY",
    "NONE",
}


def _require_project(db: Session, project_id: int, user_id: int):
    project = get_project_by_id(db, project_id, user_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _member_to_ai_row(member: ProjectMember) -> SimpleNamespace:
    """Flatten a ProjectMember + User into the shape ai_engine expects."""
    return SimpleNamespace(
        user_id=member.user_id,
        name=member.user.name if member.user else None,
        email=member.user.email if member.user else None,
        role=member.role,
    )


def _project_to_response(project: Project, viewer_id: int) -> ProjectResponse:
    role = "OWNER" if project.user_id == viewer_id else "MEMBER"
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        created_at=project.created_at,
        updated_at=project.updated_at,
        owner_id=project.user_id,
        role=role,
    )


def _member_to_response(member: ProjectMember) -> ProjectMemberResponse:
    return ProjectMemberResponse(
        id=member.id,
        user_id=member.user_id,
        role=member.role,
        email=member.user.email,
        name=member.user.name,
        picture=member.user.picture,
    )


def _find_project_in_list(
    projects: list[Project], target_id: int | None
) -> Project | None:
    if target_id is None:
        return None
    for project in projects:
        if project.id == target_id:
            return project
    return None


@router.get("/capabilities", response_model=CapabilitiesResponse)
def get_capabilities():
    return CapabilitiesResponse(
        capabilities=[
            CapabilityItem(**item) for item in CAPABILITIES_DATA["capabilities"]
        ],
        quick_prompts=[
            CapabilityExample(**p) for p in CAPABILITIES_DATA["quick_prompts"]
        ],
    )


class ChatExecutionContext:
    """Mutable bag of state that grows as we execute each AI action."""

    def __init__(self, viewer_role: str):
        self.viewer_role = viewer_role
        self.task_affected: TaskResponse | None = None
        self.project_affected: ProjectResponse | None = None
        self.member_affected: ProjectMemberResponse | None = None
        self.refresh: set[str] = set()
        self.action_taken: list[str] = []
        # Override the model's reply only when we have something objectively
        # more accurate to say (e.g. permission denied, target missing).
        self.reply_override: str | None = None

    def add_refresh(self, *keys: str) -> None:
        for key in keys:
            self.refresh.add(key)


def _execute_create(
    db: Session,
    task_data: dict,
    user_id: int,
    project_id: int,
    ctx: ChatExecutionContext,
):
    task_create = TaskCreate(
        title=task_data.get("title") or "Untitled Task",
        priority=task_data.get("priority") or "MEDIUM",
        status=task_data.get("status") or "TODO",
        deadline=task_data.get("deadline"),
        category=task_data.get("category") or "General",
        assignee=task_data.get("assignee"),
        asset_link=task_data.get("asset_link"),
        assigned_to_user_id=task_data.get("assigned_to_user_id"),
    )
    created_task = create_task(db, task_create, user_id, project_id)
    ctx.task_affected = TaskResponse.model_validate(created_task)
    ctx.add_refresh("tasks")


def _execute_update(
    db: Session,
    task_data: dict,
    user_id: int,
    project_id: int,
    ctx: ChatExecutionContext,
):
    target_id = task_data.get("target_id")
    if not target_id:
        ctx.reply_override = "I couldn't find that task. Could you be more specific? 😊"
        return

    update_fields = {
        field: task_data[field]
        for field in (
            "title",
            "priority",
            "status",
            "deadline",
            "category",
            "assignee",
            "asset_link",
            "assigned_to_user_id",
        )
        if task_data.get(field) is not None
    }
    task_update = TaskUpdate(**update_fields)
    updated_task = update_task(db, target_id, task_update, user_id, project_id)
    if updated_task:
        ctx.task_affected = TaskResponse.model_validate(updated_task)
        ctx.add_refresh("tasks")
    else:
        ctx.reply_override = "I couldn't find that task. Could you be more specific? 😊"


def _execute_delete(
    db: Session,
    task_data: dict,
    user_id: int,
    project_id: int,
    ctx: ChatExecutionContext,
):
    target_id = task_data.get("target_id")
    if not target_id:
        ctx.reply_override = "I couldn't find that task to delete. Which one did you mean? 😊"
        return
    if not delete_task(db, target_id, user_id, project_id):
        ctx.reply_override = "I couldn't find that task to delete. Which one did you mean? 😊"
        return
    ctx.add_refresh("tasks")


def _execute_assign(
    db: Session,
    task_data: dict,
    user_id: int,
    project_id: int,
    ctx: ChatExecutionContext,
):
    target_id = task_data.get("target_id")
    if not target_id:
        ctx.reply_override = "Which task should I assign? Tell me the task name. 🤔"
        return

    assigned_user_id = task_data.get("assigned_to_user_id")
    # An ASSIGN with assigned_to_user_id == None means "unassign".
    # We always send the field through so update_task clears the link.
    update_fields = {"assigned_to_user_id": assigned_user_id}
    if task_data.get("assignee") is not None or assigned_user_id is None:
        update_fields["assignee"] = task_data.get("assignee")
    task_update = TaskUpdate(**update_fields)
    updated_task = update_task(db, target_id, task_update, user_id, project_id)
    if updated_task:
        ctx.task_affected = TaskResponse.model_validate(updated_task)
        ctx.add_refresh("tasks")
    else:
        ctx.reply_override = "I couldn't find that task. Could you be more specific? 😊"


def _execute_create_project(
    db: Session,
    project_data: dict,
    user_id: int,
    ctx: ChatExecutionContext,
):
    name = (project_data.get("name") or "").strip()
    if not name:
        ctx.reply_override = "What should I call the new project? 🆕"
        return
    new_project = create_project(
        db,
        ProjectCreate(name=name, description=project_data.get("description")),
        user_id,
    )
    ctx.project_affected = _project_to_response(new_project, user_id)
    ctx.add_refresh("projects")


def _execute_update_project(
    db: Session,
    project_data: dict,
    user_id: int,
    active_project_id: int,
    ctx: ChatExecutionContext,
):
    target_id = project_data.get("target_id") or active_project_id
    role = get_user_role_in_project(db, target_id, user_id)
    if role != "OWNER":
        ctx.reply_override = "Only the project owner can rename a project. 🔒"
        return

    update_fields = {
        field: project_data[field]
        for field in ("name", "description")
        if project_data.get(field) is not None
    }
    if not update_fields:
        ctx.reply_override = "What would you like to change about the project? 🤔"
        return

    updated = update_project(db, target_id, ProjectUpdate(**update_fields), user_id)
    if updated is None:
        ctx.reply_override = "I couldn't find that project. 😕"
    else:
        ctx.project_affected = _project_to_response(updated, user_id)
        ctx.add_refresh("projects")


def _execute_delete_project(
    db: Session,
    project_data: dict,
    user_id: int,
    active_project_id: int,
    accessible_projects: list[Project],
    ctx: ChatExecutionContext,
):
    target_id = project_data.get("target_id") or active_project_id
    target_project = _find_project_in_list(accessible_projects, target_id)
    if target_project is None:
        ctx.reply_override = "I couldn't find that project. 😕"
        return
    if target_project.user_id != user_id:
        ctx.reply_override = "Only the project owner can delete it. 🔒"
        return

    if delete_project(db, target_id, user_id):
        ctx.project_affected = _project_to_response(target_project, user_id)
        ctx.add_refresh("projects", "tasks")
    else:
        ctx.reply_override = "I couldn't delete that project. 😕"


def _execute_add_member(
    db: Session,
    member_data: dict,
    project_id: int,
    ctx: ChatExecutionContext,
):
    if ctx.viewer_role != "OWNER":
        ctx.reply_override = "Only the project owner can add members. 🔒"
        return

    email = (member_data.get("email") or "").strip()
    if not email:
        ctx.reply_override = "What's the email address of the person to add? 📧"
        return

    member, code = add_project_member_by_email(db, project_id, email)
    if code == "ok" and member is not None:
        ctx.member_affected = _member_to_response(member)
        ctx.add_refresh("members")
    elif code == "invalid_email":
        ctx.reply_override = f"'{email}' doesn't look like a valid email. ✉️"
    elif code == "not_found":
        ctx.reply_override = (
            f"I couldn't find a registered user with the email {email}. "
            "They need to sign in once first. 👀"
        )
    elif code == "already_member":
        ctx.reply_override = "That person is already on the team. ✅"


def _execute_remove_member(
    db: Session,
    member_data: dict,
    user_id: int,
    project_id: int,
    ctx: ChatExecutionContext,
):
    if ctx.viewer_role != "OWNER":
        ctx.reply_override = "Only the project owner can remove members. 🔒"
        return

    target_user_id = member_data.get("target_user_id")
    if not target_user_id:
        ctx.reply_override = "Who should I remove from the team? 🤔"
        return
    if target_user_id == user_id:
        ctx.reply_override = "You can't remove yourself as the owner. 🙃"
        return
    if remove_project_member(db, project_id, target_user_id):
        ctx.add_refresh("members", "tasks")
    else:
        ctx.reply_override = (
            "I couldn't remove that person. They may not be on the team "
            "(or they're the owner). 😕"
        )


def _execute_one_action(
    db: Session,
    action: str,
    task_data: dict,
    project_data: dict,
    member_data: dict,
    current_user: User,
    request_project_id: int,
    accessible_projects: list[Project],
    ctx: ChatExecutionContext,
):
    """Dispatch a single action to the right handler. Mutates `ctx` in place."""
    ctx.action_taken.append(action)

    if action == "CREATE":
        _execute_create(db, task_data, current_user.id, request_project_id, ctx)
    elif action == "UPDATE":
        _execute_update(db, task_data, current_user.id, request_project_id, ctx)
    elif action == "DELETE":
        _execute_delete(db, task_data, current_user.id, request_project_id, ctx)
    elif action == "ASSIGN":
        _execute_assign(db, task_data, current_user.id, request_project_id, ctx)
    elif action == "CREATE_PROJECT":
        _execute_create_project(db, project_data, current_user.id, ctx)
    elif action == "UPDATE_PROJECT":
        _execute_update_project(
            db, project_data, current_user.id, request_project_id, ctx
        )
    elif action == "DELETE_PROJECT":
        _execute_delete_project(
            db,
            project_data,
            current_user.id,
            request_project_id,
            accessible_projects,
            ctx,
        )
    elif action == "ADD_MEMBER":
        _execute_add_member(db, member_data, request_project_id, ctx)
    elif action == "REMOVE_MEMBER":
        _execute_remove_member(
            db, member_data, current_user.id, request_project_id, ctx
        )
    elif action == "LIST_MEMBERS":
        ctx.add_refresh("members")
    elif action == "LIST_PROJECTS":
        ctx.add_refresh("projects")
    elif action in READ_ONLY_ACTIONS:
        # FOCUS / SUMMARY / SHOW_* / SEARCH / HELP / CLARIFY / NONE
        # All handled by the AI's textual reply — no DB work needed.
        return
    # Unknown actions are silently skipped (logged via action_taken history).


@router.post("", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = _require_project(db, request.project_id, current_user.id)
    create_chat_message(
        db, current_user.id, request.project_id, "user", request.message
    )

    # --- Gather real, fresh data the AI can reason over -----------------------

    tasks = get_all_tasks(db, request.project_id)
    task_list_string = build_task_list_string(tasks)
    stats_string = build_stats_string(tasks)
    overdue_string = build_overdue_string(tasks)

    members = list_project_members(db, request.project_id)
    member_list_string = build_member_list_string(
        [_member_to_ai_row(m) for m in members]
    )

    accessible_projects = list_projects(db, current_user.id)
    project_list_string = build_project_list_string(
        accessible_projects, active_project_id=request.project_id
    )
    projects_by_id = {p.id: p.name for p in accessible_projects}

    my_assigned = get_tasks_assigned_to_user(db, current_user.id)
    my_assigned_string = build_my_assigned_string(
        my_assigned, projects_by_id, current_user.id
    )

    recent_history = get_task_history(
        db, current_user.id, project_id=request.project_id, limit=20
    )
    history_string = build_history_string(recent_history)

    viewer_role = (
        get_user_role_in_project(db, request.project_id, current_user.id) or "MEMBER"
    )

    mode = request.mode if request.mode in ("guided", "auto") else "guided"

    # --- Ask the AI what to do -----------------------------------------------

    ai_response = call_openai(
        message=request.message,
        conversation_history=request.conversation_history,
        task_list_string=task_list_string,
        project_name=project.name,
        project_description=project.description or "",
        project_id=project.id,
        mode=mode,
        member_list_string=member_list_string,
        project_list_string=project_list_string,
        viewer_name=current_user.name,
        viewer_id=current_user.id,
        viewer_role=viewer_role,
        stats_string=stats_string,
        overdue_string=overdue_string,
        my_assigned_string=my_assigned_string,
        history_string=history_string,
    )

    actions = ai_response.get("actions") or []
    reply = ai_response.get("reply") or "I'm not sure how to respond to that. 😊"

    ctx = ChatExecutionContext(viewer_role=viewer_role)

    # --- Execute every action the model asked for, in order ------------------

    for entry in actions:
        action = entry.get("action") or "NONE"
        task_data = entry.get("task") if isinstance(entry.get("task"), dict) else {}
        project_data = (
            entry.get("project") if isinstance(entry.get("project"), dict) else {}
        )
        member_data = (
            entry.get("member") if isinstance(entry.get("member"), dict) else {}
        )

        _execute_one_action(
            db=db,
            action=action,
            task_data=task_data,
            project_data=project_data,
            member_data=member_data,
            current_user=current_user,
            request_project_id=request.project_id,
            accessible_projects=accessible_projects,
            ctx=ctx,
        )

    # --- Compose the final reply / response ----------------------------------

    if ctx.reply_override:
        reply = ctx.reply_override

    # HELP safety net: if model produced a weak reply, fall back to the
    # canonical capability catalog.
    if any(a.get("action") == "HELP" for a in actions):
        if not reply or len(reply.strip()) < 40:
            reply = (
                "Here's everything I can help you with — just ask me in plain "
                "English:\n\n"
                f"{CAPABILITIES_HELP_STRING}\n\n"
                "Try any of the prompts above and I'll take it from there! ✨"
            )

    fresh_tasks = get_all_tasks(db, request.project_id)
    create_chat_message(db, current_user.id, request.project_id, "assistant", reply)

    # For the response envelope, surface the most informative single action
    # name. Multi-action turns expose the full list via the comma-joined
    # string so the frontend can still display it sensibly.
    if not ctx.action_taken:
        action_taken_str = "NONE"
    elif len(ctx.action_taken) == 1:
        action_taken_str = ctx.action_taken[0]
    else:
        action_taken_str = ",".join(ctx.action_taken)

    return ChatResponse(
        reply=reply,
        action_taken=action_taken_str,
        task_affected=ctx.task_affected,
        project_affected=ctx.project_affected,
        member_affected=ctx.member_affected,
        refresh=sorted(ctx.refresh),
        tasks=[TaskResponse.model_validate(task) for task in fresh_tasks],
    )


@router.get("/history", response_model=list[ChatMessageResponse])
def history(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_project(db, project_id, current_user.id)
    return get_chat_history(db, current_user.id, project_id)
