from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from models import ChatMessage, Project, ProjectMember, Task, TaskHistory, User
from schemas import ProfileUpdate, ProjectCreate, ProjectUpdate, TaskCreate, TaskUpdate


def _record_history(
    db: Session,
    user_id: int,
    project_id: int,
    task_id: int | None,
    task_title: str,
    action: str,
    details: str | None = None,
) -> None:
    entry = TaskHistory(
        user_id=user_id,
        project_id=project_id,
        task_id=task_id,
        task_title=task_title,
        action=action,
        details=details,
    )
    db.add(entry)
    db.commit()


def _summarize_changes(changes: dict, task: Task) -> str:
    """Build a human-friendly description of a task update."""
    parts = []
    for field, value in changes.items():
        if field == "status":
            parts.append(f"status -> {value}")
        elif field == "priority":
            parts.append(f"priority -> {value}")
        elif field == "deadline":
            parts.append(f"deadline -> {value or 'none'}")
        elif field == "title":
            parts.append(f"renamed to '{value}'")
        elif field == "category":
            parts.append(f"category -> {value}")
        elif field == "assignee":
            parts.append(f"assignee -> {value or 'none'}")
        elif field == "asset_link":
            parts.append("link updated")
    if not parts:
        return f"Updated task '{task.title}'."
    return "; ".join(parts)


# --- Projects ---


def list_projects(db: Session, user_id: int) -> list[Project]:
    """Projects the user owns OR is a member of, newest first."""
    member_project_ids = select(ProjectMember.project_id).where(
        ProjectMember.user_id == user_id
    )

    return (
        db.query(Project)
        .filter(
            or_(
                Project.user_id == user_id,
                Project.id.in_(member_project_ids),
            )
        )
        .order_by(Project.updated_at.desc())
        .all()
    )


def get_project_by_id(db: Session, project_id: int, user_id: int) -> Project | None:
    """Return the project if the user is the owner OR a member."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if project is None:
        return None
    if project.user_id == user_id:
        return project
    is_member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
        .first()
    )
    return project if is_member else None


def get_user_role_in_project(db: Session, project_id: int, user_id: int) -> str | None:
    """Return 'OWNER' if the user owns the project, 'MEMBER' if they're a member, else None."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if project is None:
        return None
    if project.user_id == user_id:
        return "OWNER"
    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
        .first()
    )
    return member.role if member else None


def create_project(db: Session, project: ProjectCreate, user_id: int) -> Project:
    new_project = Project(
        user_id=user_id,
        name=project.name.strip(),
        description=project.description,
    )
    db.add(new_project)
    db.flush()
    # Owner is always also recorded in the membership table for easy listing.
    owner_membership = ProjectMember(
        project_id=new_project.id,
        user_id=user_id,
        role="OWNER",
    )
    db.add(owner_membership)
    db.commit()
    db.refresh(new_project)
    return new_project


def update_project(
    db: Session, project_id: int, updates: ProjectUpdate, user_id: int
) -> Project | None:
    project = db.query(Project).filter(
        Project.id == project_id, Project.user_id == user_id
    ).first()
    if project is None:
        return None

    changes = updates.model_dump(exclude_unset=True, exclude_none=True)
    for field, value in changes.items():
        if field == "name" and isinstance(value, str):
            value = value.strip()
        setattr(project, field, value)

    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project_id: int, user_id: int) -> bool:
    project = db.query(Project).filter(
        Project.id == project_id, Project.user_id == user_id
    ).first()
    if project is None:
        return False

    db.delete(project)
    db.commit()
    return True


def ensure_default_project(db: Session, user_id: int) -> Project:
    existing = list_projects(db, user_id)
    if existing:
        return existing[0]

    return create_project(
        db,
        ProjectCreate(name="Inbox", description="Default project"),
        user_id,
    )


# --- Project members ---


def list_project_members(db: Session, project_id: int) -> list[ProjectMember]:
    return (
        db.query(ProjectMember)
        .filter(ProjectMember.project_id == project_id)
        .order_by(ProjectMember.role.desc(), ProjectMember.added_at.asc())
        .all()
    )


def add_project_member_by_email(
    db: Session, project_id: int, email: str
) -> tuple[ProjectMember | None, str]:
    """Attach a registered user to the project by email.

    Returns (member, error_code). error_code is one of:
    'ok', 'not_found', 'already_member', 'invalid_email'.
    """
    email_clean = (email or "").strip().lower()
    if not email_clean or "@" not in email_clean:
        return None, "invalid_email"

    user = db.query(User).filter(User.email == email_clean).first()
    if user is None:
        return None, "not_found"

    existing = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user.id,
        )
        .first()
    )
    if existing:
        return None, "already_member"

    member = ProjectMember(project_id=project_id, user_id=user.id, role="MEMBER")
    db.add(member)
    db.commit()
    db.refresh(member)
    return member, "ok"


def remove_project_member(
    db: Session, project_id: int, user_id_to_remove: int
) -> bool:
    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id_to_remove,
        )
        .first()
    )
    if member is None or member.role == "OWNER":
        return False

    # Unassign any tasks owned by this user within the project.
    db.query(Task).filter(
        Task.project_id == project_id,
        Task.assigned_to_user_id == user_id_to_remove,
    ).update({Task.assigned_to_user_id: None})

    db.delete(member)
    db.commit()
    return True


def lookup_user_by_email(db: Session, email: str) -> User | None:
    email_clean = (email or "").strip().lower()
    if not email_clean or "@" not in email_clean:
        return None
    return db.query(User).filter(User.email == email_clean).first()


# --- Tasks ---


def get_all_tasks(db: Session, project_id: int) -> list[Task]:
    """All tasks in a project. Access control happens at the route layer."""
    return (
        db.query(Task)
        .filter(Task.project_id == project_id)
        .order_by(Task.created_at.desc())
        .all()
    )


def get_task_by_id(db: Session, task_id: int, project_id: int) -> Task | None:
    return (
        db.query(Task)
        .filter(Task.id == task_id, Task.project_id == project_id)
        .first()
    )


def _resolve_task_assignment(
    db: Session, project_id: int, assigned_to_user_id: int | None
) -> tuple[int | None, str | None]:
    """Validate an assignment and return (assigned_user_id, assignee_name)."""
    if assigned_to_user_id is None:
        return None, None

    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == assigned_to_user_id,
        )
        .first()
    )
    if member is None:
        return None, None

    user = db.query(User).filter(User.id == assigned_to_user_id).first()
    name = user.name if user else None
    return assigned_to_user_id, name


def create_task(
    db: Session, task: TaskCreate, user_id: int, project_id: int
) -> Task:
    payload = task.model_dump()
    assigned_id = payload.pop("assigned_to_user_id", None)
    resolved_id, resolved_name = _resolve_task_assignment(db, project_id, assigned_id)
    if resolved_id is not None:
        payload["assignee"] = resolved_name or payload.get("assignee")

    new_task = Task(
        **payload,
        user_id=user_id,
        project_id=project_id,
        assigned_to_user_id=resolved_id,
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    _record_history(
        db,
        user_id=user_id,
        project_id=project_id,
        task_id=new_task.id,
        task_title=new_task.title,
        action="CREATED",
        details=f"Priority {new_task.priority}, category {new_task.category}.",
    )
    return new_task


def update_task(
    db: Session, task_id: int, updates: TaskUpdate, user_id: int, project_id: int
) -> Task | None:
    task = get_task_by_id(db, task_id, project_id)
    if task is None:
        return None

    # Use exclude_unset=True so we only apply fields the caller actually sent,
    # but keep explicit nulls so callers can clear assignee / deadline / etc.
    changes = updates.model_dump(exclude_unset=True)

    # Guard NOT NULL columns: callers must never null these out. If a caller
    # sends an explicit None, treat it as "no change" rather than crashing on
    # the DB constraint.
    for non_nullable in ("title", "priority", "status", "category"):
        if non_nullable in changes and changes[non_nullable] is None:
            changes.pop(non_nullable)

    became_done = (
        "status" in changes and changes["status"] == "DONE" and task.status != "DONE"
    )

    if "assigned_to_user_id" in changes:
        assigned_id = changes.pop("assigned_to_user_id")
        resolved_id, resolved_name = _resolve_task_assignment(
            db, project_id, assigned_id
        )
        changes["assigned_to_user_id"] = resolved_id
        if "assignee" not in changes:
            changes["assignee"] = resolved_name

    for field, value in changes.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)

    if changes:
        action = "COMPLETED" if became_done else "UPDATED"
        details = (
            "Marked as done."
            if became_done
            else _summarize_changes(changes, task)
        )
        _record_history(
            db,
            user_id=user_id,
            project_id=project_id,
            task_id=task.id,
            task_title=task.title,
            action=action,
            details=details,
        )
    return task


def delete_task(
    db: Session, task_id: int, user_id: int, project_id: int
) -> bool:
    task = get_task_by_id(db, task_id, project_id)
    if task is None:
        return False

    snapshot_title = task.title
    snapshot_id = task.id
    db.delete(task)
    db.commit()

    _record_history(
        db,
        user_id=user_id,
        project_id=project_id,
        task_id=snapshot_id,
        task_title=snapshot_title,
        action="DELETED",
        details=f"Removed task '{snapshot_title}'.",
    )
    return True


def get_tasks_assigned_to_user(db: Session, user_id: int) -> list[Task]:
    return (
        db.query(Task)
        .filter(Task.assigned_to_user_id == user_id)
        .order_by(Task.created_at.desc())
        .all()
    )


def get_task_history(
    db: Session, user_id: int, project_id: int | None = None, limit: int = 200
) -> list[TaskHistory]:
    query = db.query(TaskHistory).filter(TaskHistory.user_id == user_id)
    if project_id is not None:
        query = query.filter(TaskHistory.project_id == project_id)
    return query.order_by(TaskHistory.created_at.desc()).limit(limit).all()


def get_task_stats(db: Session, project_id: int) -> dict:
    base = db.query(Task).filter(Task.project_id == project_id)
    total = base.count()
    completed = base.filter(Task.status == "DONE").count()
    return {"total": total, "completed": completed}


# --- Users / Auth ---


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_google_sub(db: Session, google_sub: str) -> User | None:
    return db.query(User).filter(User.google_sub == google_sub).first()


def upsert_google_user(db: Session, profile: dict) -> User:
    user = get_user_by_google_sub(db, profile["sub"])
    if user is None:
        user = User(
            email=profile["email"],
            name=profile.get("name") or profile["email"],
            picture=profile.get("picture"),
            google_sub=profile["sub"],
        )
        db.add(user)
    else:
        user.email = profile["email"]
        user.name = profile.get("name") or user.name
        user.picture = profile.get("picture")

    db.commit()
    db.refresh(user)
    return user


def update_profile(db: Session, user: User, updates: ProfileUpdate) -> User:
    changes = updates.model_dump(exclude_unset=True, exclude_none=True)
    for field, value in changes.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


# --- Chat ---


def create_chat_message(
    db: Session, user_id: int, project_id: int, role: str, content: str
) -> ChatMessage:
    message = ChatMessage(
        user_id=user_id, project_id=project_id, role=role, content=content
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def get_chat_history(
    db: Session, user_id: int, project_id: int, limit: int = 50
) -> list[ChatMessage]:
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id, ChatMessage.project_id == project_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
        .all()
    )
    return list(reversed(messages))
