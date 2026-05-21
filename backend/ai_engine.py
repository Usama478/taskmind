import json
import os
from datetime import datetime, timedelta

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI()

# Model can be overridden via env so we can flip to faster / cheaper models
# without redeploying code. Defaults to gpt-4o for the best blend of speed +
# instruction-following on multi-step requests.
AI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")

CAPABILITIES_DATA = {
    "capabilities": [
        {
            "action": "CREATE",
            "title": "Create tasks",
            "description": "Add new tasks (one or many in a single message) with title, priority, deadline, category, assignee, or links.",
            "examples": [
                {
                    "label": "Urgent bug fix",
                    "prompt": "Add a high-priority task to fix the login bug by Friday",
                },
                {
                    "label": "Batch of tasks",
                    "prompt": "Create three tasks for the launch: write copy, design hero, schedule announcement",
                },
            ],
        },
        {
            "action": "UPDATE",
            "title": "Update tasks",
            "description": "Change status, priority, deadline, title, or other fields on existing tasks.",
            "examples": [
                {
                    "label": "Start working",
                    "prompt": "Move the login bug task to in-progress",
                },
                {
                    "label": "Change priority",
                    "prompt": "Make the design review task high priority",
                },
            ],
        },
        {
            "action": "DELETE",
            "title": "Delete tasks",
            "description": "Remove tasks you no longer need.",
            "examples": [
                {
                    "label": "Remove duplicate",
                    "prompt": "Delete the duplicate copy task",
                },
            ],
        },
        {
            "action": "ASSIGN",
            "title": "Assign tasks",
            "description": "Assign a task to a project member by name or email.",
            "examples": [
                {
                    "label": "Hand off to teammate",
                    "prompt": "Assign the login bug to Sarah",
                },
                {
                    "label": "Unassign",
                    "prompt": "Unassign the design review task",
                },
            ],
        },
        {
            "action": "FOCUS",
            "title": "Focus mode",
            "description": "Get suggestions on what to work on next based on priority and deadlines.",
            "examples": [
                {
                    "label": "What's next?",
                    "prompt": "What should I work on next?",
                },
            ],
        },
        {
            "action": "SUMMARY",
            "title": "Progress summary",
            "description": "See how many tasks are done, pending, and overdue.",
            "examples": [
                {
                    "label": "Weekly check-in",
                    "prompt": "How am I doing this week?",
                },
            ],
        },
        {
            "action": "SHOW_OVERDUE",
            "title": "Show overdue tasks",
            "description": "List the tasks that are past their deadline and still open.",
            "examples": [
                {
                    "label": "What's overdue?",
                    "prompt": "Show my overdue tasks",
                },
            ],
        },
        {
            "action": "SHOW_MY_TASKS",
            "title": "What's assigned to me",
            "description": "See every task assigned to you across all of your projects.",
            "examples": [
                {
                    "label": "My queue",
                    "prompt": "What's on my plate across all projects?",
                },
            ],
        },
        {
            "action": "SHOW_HISTORY",
            "title": "Recent activity",
            "description": "Look back at what changed recently in this project (created, updated, completed, deleted).",
            "examples": [
                {
                    "label": "What happened today?",
                    "prompt": "What changed recently on this project?",
                },
            ],
        },
        {
            "action": "SEARCH",
            "title": "Search & filter",
            "description": "Find tasks matching a keyword, status, priority, assignee, or due-date window.",
            "examples": [
                {
                    "label": "High priority pending",
                    "prompt": "Show me all open high-priority tasks",
                },
                {
                    "label": "Sarah's work",
                    "prompt": "What tasks does Sarah have due this week?",
                },
            ],
        },
        {
            "action": "CREATE_PROJECT",
            "title": "Create projects",
            "description": "Spin up a new project / workspace with a name and optional description.",
            "examples": [
                {
                    "label": "Marketing launch",
                    "prompt": "Create a new project called Q3 Marketing Launch",
                },
            ],
        },
        {
            "action": "UPDATE_PROJECT",
            "title": "Rename or describe projects",
            "description": "Rename the current project or update its description.",
            "examples": [
                {
                    "label": "Rename project",
                    "prompt": "Rename this project to Website Redesign",
                },
            ],
        },
        {
            "action": "DELETE_PROJECT",
            "title": "Delete a project",
            "description": "Permanently delete a project you own (along with all of its tasks).",
            "examples": [
                {
                    "label": "Remove old project",
                    "prompt": "Delete the Old Backlog project",
                },
            ],
        },
        {
            "action": "ADD_MEMBER",
            "title": "Add team members",
            "description": "Invite a registered teammate to the active project by email.",
            "examples": [
                {
                    "label": "Add by email",
                    "prompt": "Add sarah@acme.com to this project",
                },
            ],
        },
        {
            "action": "REMOVE_MEMBER",
            "title": "Remove team members",
            "description": "Remove someone from the active project's team.",
            "examples": [
                {
                    "label": "Remove member",
                    "prompt": "Remove John from this project",
                },
            ],
        },
        {
            "action": "LIST_MEMBERS",
            "title": "Show team",
            "description": "List everyone on the current project's team.",
            "examples": [
                {
                    "label": "Who's on the team?",
                    "prompt": "Who is on this project?",
                },
            ],
        },
        {
            "action": "LIST_PROJECTS",
            "title": "List projects",
            "description": "Show all projects the user can access.",
            "examples": [
                {
                    "label": "My projects",
                    "prompt": "What projects do I have?",
                },
            ],
        },
        {
            "action": "CLARIFY",
            "title": "Guided help",
            "description": "In Guide me mode, the AI asks one clarifying question when your request is vague.",
            "examples": [
                {
                    "label": "Vague request",
                    "prompt": "I need to fix something on the website",
                },
            ],
        },
        {
            "action": "HELP",
            "title": "What can you do?",
            "description": "Show the full list of things TaskMind AI can do, with an example prompt for each.",
            "examples": [
                {
                    "label": "Show capabilities",
                    "prompt": "What can you do?",
                },
                {
                    "label": "How do I assign?",
                    "prompt": "How do I assign a task to someone?",
                },
            ],
        },
    ],
    "quick_prompts": [
        {"label": "+ Add task", "prompt": "Add a new task: "},
        {"label": "What's next?", "prompt": "What should I work on next?"},
        {"label": "Daily summary", "prompt": "Give me a summary of my progress"},
        {"label": "Overdue", "prompt": "Show my overdue tasks"},
        {"label": "My queue", "prompt": "What's assigned to me across all projects?"},
        {"label": "Recent activity", "prompt": "What changed recently?"},
        {"label": "Show team", "prompt": "Who is on this project?"},
        {"label": "What can you do?", "prompt": "What can you do?"},
    ],
}


def build_capabilities_help_string() -> str:
    """Render the full capability catalog for the AI prompt.

    The same list is shown to the model so it can answer "what can you do?"
    questions with concrete example prompts, AND used as the fallback HELP
    reply if the model omits one.
    """
    lines = []
    for cap in CAPABILITIES_DATA["capabilities"]:
        title = cap.get("title") or cap.get("action")
        desc = cap.get("description", "")
        lines.append(f"- **{title}** — {desc}")
        for example in cap.get("examples", []):
            lines.append(f"  - Try: `\"{example['prompt']}\"`")
    return "\n".join(lines)


CAPABILITIES_HELP_STRING = build_capabilities_help_string()


def _parse_deadline(deadline_str):
    """Parse a YYYY-MM-DD deadline string into a midnight-aligned datetime.

    Returns None for missing or malformed values so callers can short-circuit.
    """
    if not deadline_str:
        return None
    try:
        return datetime.strptime(deadline_str, "%Y-%m-%d")
    except (ValueError, TypeError):
        return None


def build_task_list_string(tasks) -> str:
    if not tasks:
        return "No tasks currently in this project."

    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    lines = []
    for task in tasks:
        deadline_str = task.deadline if task.deadline else "null"
        category_str = task.category if hasattr(task, "category") and task.category else "General"
        assignee_str = task.assignee if hasattr(task, "assignee") and task.assignee else "None"

        # Annotate each task with a derived flag the model can use without
        # having to recompute dates itself.
        flag = ""
        deadline_dt = _parse_deadline(task.deadline)
        if task.status != "DONE" and deadline_dt is not None:
            if deadline_dt < today:
                flag = " [OVERDUE]"
            elif deadline_dt == today:
                flag = " [DUE TODAY]"
            elif deadline_dt <= today + timedelta(days=7):
                flag = " [DUE THIS WEEK]"

        line = (
            f"ID: {task.id} | Title: {task.title} | Priority: {task.priority} | "
            f"Status: {task.status} | Category: {category_str} | Assignee: {assignee_str} | "
            f"Deadline: {deadline_str}{flag}"
        )
        lines.append(line)

    return "\n".join(lines)


def build_stats_string(tasks) -> str:
    """Pre-compute project stats so the model doesn't have to count manually."""
    if not tasks:
        return "Total: 0 (no tasks yet)."

    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    week_end = today + timedelta(days=7)

    total = len(tasks)
    by_status = {"TODO": 0, "IN_PROGRESS": 0, "DONE": 0}
    by_priority = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    overdue = 0
    due_today = 0
    due_this_week = 0
    high_pending = 0

    for t in tasks:
        by_status[t.status] = by_status.get(t.status, 0) + 1
        by_priority[t.priority] = by_priority.get(t.priority, 0) + 1
        if t.priority == "HIGH" and t.status != "DONE":
            high_pending += 1
        deadline_dt = _parse_deadline(t.deadline)
        if deadline_dt and t.status != "DONE":
            if deadline_dt < today:
                overdue += 1
            elif deadline_dt == today:
                due_today += 1
            elif deadline_dt <= week_end:
                due_this_week += 1

    completion = round((by_status["DONE"] / total) * 100) if total else 0

    return (
        f"Total: {total} | Done: {by_status['DONE']} ({completion}%) | "
        f"In progress: {by_status['IN_PROGRESS']} | Todo: {by_status['TODO']} | "
        f"Overdue: {overdue} | Due today: {due_today} | Due this week: {due_this_week} | "
        f"High priority pending: {high_pending} | "
        f"By priority: HIGH={by_priority['HIGH']}, MEDIUM={by_priority['MEDIUM']}, LOW={by_priority['LOW']}"
    )


def build_overdue_string(tasks, limit: int = 10) -> str:
    """List the worst overdue tasks first so the AI can call them out by name."""
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    overdue = []
    for t in tasks:
        if t.status == "DONE":
            continue
        d = _parse_deadline(t.deadline)
        if d and d < today:
            overdue.append(((today - d).days, t))
    if not overdue:
        return "Nothing overdue. 🎉"

    overdue.sort(key=lambda pair: pair[0], reverse=True)
    lines = []
    for days_late, t in overdue[:limit]:
        assignee_str = t.assignee if getattr(t, "assignee", None) else "Unassigned"
        lines.append(
            f"ID: {t.id} | '{t.title}' | {days_late} day(s) late | "
            f"Deadline: {t.deadline} | Priority: {t.priority} | Assignee: {assignee_str}"
        )
    return "\n".join(lines)


def build_member_list_string(members) -> str:
    """Render the project's team for the AI prompt.

    `members` is expected to be an iterable of objects with `user_id`, `name`,
    `email`, and `role` attributes (i.e. ProjectMember rows joined with User).
    """
    if not members:
        return "No team members yet (only the owner has access)."

    lines = []
    for member in members:
        name = getattr(member, "name", None) or "Unknown"
        email = getattr(member, "email", None) or "unknown@example.com"
        role = getattr(member, "role", "MEMBER")
        user_id = getattr(member, "user_id", None)
        lines.append(
            f"user_id: {user_id} | Name: {name} | Email: {email} | Role: {role}"
        )
    return "\n".join(lines)


def build_project_list_string(projects, active_project_id=None) -> str:
    """Render the user's accessible projects for the AI prompt."""
    if not projects:
        return "No other projects."

    lines = []
    for project in projects:
        active_marker = " (ACTIVE)" if project.id == active_project_id else ""
        description = (project.description or "").strip().replace("\n", " ")
        if len(description) > 80:
            description = description[:77] + "..."
        lines.append(
            f"ID: {project.id} | Name: {project.name}{active_marker} | "
            f"Description: {description or 'None'}"
        )
    return "\n".join(lines)


def build_my_assigned_string(assigned_tasks, projects_by_id, viewer_id, limit: int = 25) -> str:
    """Tasks assigned to the signed-in user across every project they can see."""
    if not assigned_tasks:
        return "Nothing currently assigned to you across projects."

    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    lines = []
    for t in assigned_tasks[:limit]:
        project_name = projects_by_id.get(t.project_id, "?")
        flag = ""
        d = _parse_deadline(t.deadline)
        if t.status != "DONE" and d is not None:
            if d < today:
                flag = " [OVERDUE]"
            elif d == today:
                flag = " [DUE TODAY]"
        lines.append(
            f"ID: {t.id} | '{t.title}' | Project: {project_name} (id: {t.project_id}) | "
            f"Status: {t.status} | Priority: {t.priority} | "
            f"Deadline: {t.deadline or 'none'}{flag}"
        )
    return "\n".join(lines)


def build_history_string(history, limit: int = 15) -> str:
    """Recent task-history entries so the AI can answer 'what changed?' questions."""
    if not history:
        return "No recent activity recorded."
    lines = []
    for entry in history[:limit]:
        when = entry.created_at.strftime("%Y-%m-%d %H:%M") if entry.created_at else "?"
        details = (entry.details or "").replace("\n", " ")
        if len(details) > 100:
            details = details[:97] + "..."
        lines.append(
            f"{when} | {entry.action} | '{entry.task_title}' | {details}"
        )
    return "\n".join(lines)


SYSTEM_PROMPT_TEMPLATE = """You are TaskMind AI, an intelligent project management assistant embedded in a task management application.

CURRENT DATE: {today_date} ({today_weekday})
SIGNED-IN USER: {viewer_name} (user_id: {viewer_id}, role on this project: {viewer_role})

ACTIVE PROJECT: {project_name} (id: {project_id})
PROJECT DESCRIPTION: {project_description}

PROJECT STATS (pre-computed — do not recount):
{stats}

CURRENT TASKS IN THIS PROJECT (each task pre-flagged with OVERDUE / DUE TODAY / DUE THIS WEEK where relevant):
{task_list}

OVERDUE TASKS (worst first):
{overdue_list}

TASKS ASSIGNED TO THE SIGNED-IN USER ACROSS ALL THEIR PROJECTS:
{my_assigned_list}

RECENT ACTIVITY IN THIS PROJECT (newest first):
{history_list}

TEAM MEMBERS ON THIS PROJECT:
{member_list}

USER'S OTHER PROJECTS:
{project_list}

THINGS YOU CAN DO (your full capability catalog — use this verbatim when the user asks what you can do):
{capabilities_help}

INTERACTION MODE: {mode}
- guided: If the user's message is vague or missing key details (title, what to do, which member, which project), use action CLARIFY and ask exactly ONE short friendly question. If the message is specific enough, act immediately without asking.
- auto: Never use CLARIFY. Always act immediately. Fill missing fields with defaults: priority MEDIUM, status TODO, category General, deadline null.

YOUR JOB:
Analyze the user's message and respond with ONLY a valid JSON object. No explanation. No markdown. No text before or after the JSON.

You can perform MULTIPLE actions in one response when the user asks for several things at once (e.g. "create three tasks for the launch and assign them to Sarah" -> three CREATE actions, each with assignee filled in). Put every action you intend to take into the `actions` array, in execution order. Write a single combined `reply` that confirms everything you did.

RESPONSE FORMAT (strict):
{{
  "actions": [
    {{
      "action": "CREATE" | "UPDATE" | "DELETE" | "ASSIGN" | "FOCUS" | "SUMMARY" | "SHOW_OVERDUE" | "SHOW_MY_TASKS" | "SHOW_HISTORY" | "SEARCH" | "CREATE_PROJECT" | "UPDATE_PROJECT" | "DELETE_PROJECT" | "ADD_MEMBER" | "REMOVE_MEMBER" | "LIST_MEMBERS" | "LIST_PROJECTS" | "HELP" | "CLARIFY" | "NONE",
      "task": {{
        "title": "string or null",
        "priority": "HIGH" | "MEDIUM" | "LOW" | null,
        "status": "TODO" | "IN_PROGRESS" | "DONE" | null,
        "deadline": "YYYY-MM-DD or null",
        "category": "string or null",
        "assignee": "string or null",
        "assigned_to_user_id": number_or_null,
        "asset_link": "string (URL) or null",
        "target_id": number_or_null
      }},
      "project": {{
        "name": "string or null",
        "description": "string or null",
        "target_id": number_or_null
      }},
      "member": {{
        "email": "string or null",
        "target_user_id": number_or_null
      }}
    }}
  ],
  "reply": "Your single combined response to the user"
}}

If only one action is needed, return a one-element `actions` array. For pure conversation (no mutation, no listing), use a single action with `action: "NONE"`.

ACTION RULES:
- CREATE: User wants to add a new task. Extract title, priority, deadline. If they mention a teammate by name or email that matches a TEAM MEMBER row above, set task.assigned_to_user_id and copy the name into task.assignee. For batch requests ("add tasks A, B, and C"), emit one CREATE action per task.
- UPDATE: User wants to change an existing task. Set task.target_id to the matching task id from CURRENT TASKS. Only include fields the user is actually changing.
- DELETE: User wants to remove a task. Set task.target_id to the matching task id.
- ASSIGN: User wants to assign / reassign / unassign a task to a teammate.
  * task.target_id MUST be the id of an existing task.
  * To assign: set task.assigned_to_user_id to the matching team member's user_id and task.assignee to their display name.
  * To unassign: set task.assigned_to_user_id to null and task.assignee to null.
  * If the named person is NOT in TEAM MEMBERS, switch to CLARIFY (guided) or use NONE with a reply explaining you can only assign to project members (auto).
- FOCUS: User asks what to work on. Analyze tasks by priority + deadline. Suggest top 2-3, citing real task IDs / titles from CURRENT TASKS.
- SUMMARY: User asks for progress. Read the PROJECT STATS line verbatim — quote real numbers. Always mention overdue + high-priority pending if non-zero.
- SHOW_OVERDUE: User asks what's overdue / past due / late. Reply by listing the OVERDUE TASKS above (titles + days late + assignee). If nothing is overdue, celebrate that fact.
- SHOW_MY_TASKS: User asks what's on their plate / assigned to them / their queue. Reply using the TASKS ASSIGNED TO THE SIGNED-IN USER list (group by project if it spans several).
- SHOW_HISTORY: User asks what changed recently / what happened today / recent activity. Reply by summarising the RECENT ACTIVITY list (most recent first).
- SEARCH: User asks for a filtered slice of tasks ("high-priority tasks", "tasks due this week", "Sarah's tasks"). Filter CURRENT TASKS in your head and reply with the matches (title + id + key fields). No DB mutation.
- CREATE_PROJECT: User wants a brand new project. Put the new project's name/description in `project.name` and `project.description`. Leave project.target_id null.
- UPDATE_PROJECT: User wants to rename or re-describe a project. Default to the ACTIVE PROJECT; only set project.target_id if they clearly reference a different one from USER'S OTHER PROJECTS.
- DELETE_PROJECT: User wants to remove a project. Set project.target_id to the project they mean (use ACTIVE PROJECT id if unclear AND viewer_role is OWNER). Only OWNERS can delete; if viewer_role is MEMBER, refuse politely with NONE.
- ADD_MEMBER: User wants to invite a teammate to the ACTIVE PROJECT. Put their email in member.email. Only OWNERS can do this; if viewer_role is MEMBER, refuse politely with NONE.
- REMOVE_MEMBER: User wants to remove a teammate from the ACTIVE PROJECT. Match the name/email against TEAM MEMBERS, then set member.target_user_id. Never remove an OWNER. Only OWNERS can do this.
- LIST_MEMBERS: User asks who is on the team. Just craft a friendly reply that lists them; no extra fields needed.
- LIST_PROJECTS: User asks what projects they have. Just craft a friendly reply that lists them; no extra fields needed.
- HELP: User asks what you can do / what your features are / how to use you / for a list of commands ("what can you do", "help", "show me commands", "how do I ...", "what features do you have", "guide me"). Reply using markdown: group related items with a **Group:** line (Tasks, Team, Projects, Insights), then list every capability as `- **Title** — description` with sub-bullets `  - Try: \`"example prompt"\`` for each example from THINGS YOU CAN DO. Keep the catalog complete — don't skip items. End with a short encouraging sentence + emoji.
- CLARIFY: Message is too ambiguous to act on (only in guided mode). Ask exactly ONE question.
- NONE: General conversation OR a refusal (e.g. permission denied). No data mutation needed.

PRIORITY INFERENCE RULES:
- urgent / critical / asap / today / important = HIGH
- someday / whenever / low priority / not urgent = LOW
- everything else or unspecified = MEDIUM

DEADLINE PARSING RULES:
- "today" = current date
- "tomorrow" = current date + 1 day
- "this Friday" / "Friday" = upcoming Friday's date
- "next week" = current date + 7 days
- "Monday" = upcoming Monday
- Specific dates like "January 15" = parse to YYYY-MM-DD
- Vague like "soon" or "sometime" = null

EXTRACTION RULES:
- category: Assign to a relevant bucket (e.g., "Video", "Copy", "Design", "Social", "Review", "General"). Default to "General" if unclear.
- assignee: When the user mentions a teammate, prefer matching them against TEAM MEMBERS above and populate BOTH assignee (their display name) AND assigned_to_user_id (their user_id). If you only have a free-text name with no match, you may still set assignee but leave assigned_to_user_id null.
- asset_link: Extract any valid URL provided in the message (e.g., https://figma.com/...).
- member.email: For ADD_MEMBER, extract the email exactly as written.

REPLY RULES:
- Replies are rendered as markdown in the chat UI. Format multi-item replies with `-` bullets and `**bold**` for titles/labels. Wrap user-facing example prompts in backticks. Use blank lines between groups.
- Default length is 1-3 sentences. HELP / LIST_MEMBERS / LIST_PROJECTS / SHOW_OVERDUE / SHOW_MY_TASKS / SHOW_HISTORY / SEARCH may be longer (use markdown bullets).
- When you perform several actions, the SINGLE reply should mention each (e.g. "Done — created 3 tasks and assigned them to Sarah.").
- Always end with a relevant emoji.
- Never mention JSON or technical terms (don't say "action", "field", or "JSON" to the user).
- Always confirm what action was taken (or refused).
- Mention the project name "{project_name}" when creating or updating tasks.
- Be friendly, concise, and encouraging.
- For FOCUS: explain WHY you're suggesting each task (priority + how soon it's due). List suggestions as `- **Task title** (id N) — reason`.
- For SUMMARY: cite real numbers from PROJECT STATS as bullets with **bold** metric labels (e.g. `- **Done:** 3 (30%)`). End with a motivational line.
- For SHOW_OVERDUE: list each overdue task as `- **Task title** (id N) — X day(s) late — assignee`, sorted worst first.
- For SHOW_MY_TASKS: group by project name when the list spans multiple projects; use `- **Task title** (id N) — status, priority, deadline`.
- For SHOW_HISTORY: summarise the last few events as bullets with timestamps.
- For SEARCH: clearly state the filter, then list matches as `- **Task title** (id N) — key fields`.
- For LIST_MEMBERS / LIST_PROJECTS: include the actual names as bullets.
- For HELP: list every capability from THINGS YOU CAN DO as `- **Title** — description` with sub-bullets `  - Try: \`"example"\``. Group with **Tasks:**, **Team:**, **Projects:**, **Insights:** headers. Finish with a one-line encouragement + emoji.
- For CLARIFY: ask only ONE question, be friendly.
- For permission denials (non-owner trying to delete project, add/remove members): explain kindly that only the owner can do that.

MATCHING EXISTING RECORDS:
- Tasks: match by title similarity ("login bug" -> "Fix login bug"). Pick the closest match. Always mention the exact task title in your reply so the user can confirm.
- Members: match by name (case-insensitive, partial OK) or email against TEAM MEMBERS. Never invent a user_id.
- Projects: match by name (case-insensitive, partial OK) against USER'S OTHER PROJECTS or the ACTIVE PROJECT.

UNKNOWN FIELDS:
- Anywhere a field is not applicable, set it to null. Always include all three groups (task, project, member) inside each action, with null fields where unused."""


def call_openai(
    message: str,
    conversation_history: list,
    task_list_string: str,
    project_name: str = "Project",
    project_description: str = "",
    project_id: int | None = None,
    mode: str = "guided",
    member_list_string: str = "No team members yet (only the owner has access).",
    project_list_string: str = "No other projects.",
    viewer_name: str = "User",
    viewer_id: int | None = None,
    viewer_role: str = "OWNER",
    stats_string: str = "Total: 0 (no tasks yet).",
    overdue_string: str = "Nothing overdue. 🎉",
    my_assigned_string: str = "Nothing currently assigned to you across projects.",
    history_string: str = "No recent activity recorded.",
) -> dict:
    try:
        now = datetime.now()
        today_date = now.strftime("%Y-%m-%d")
        today_weekday = now.strftime("%A")

        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
            today_date=today_date,
            today_weekday=today_weekday,
            project_name=project_name,
            project_id=project_id if project_id is not None else "unknown",
            project_description=project_description or "No description",
            task_list=task_list_string,
            stats=stats_string,
            overdue_list=overdue_string,
            my_assigned_list=my_assigned_string,
            history_list=history_string,
            member_list=member_list_string,
            project_list=project_list_string,
            capabilities_help=CAPABILITIES_HELP_STRING,
            viewer_name=viewer_name,
            viewer_id=viewer_id if viewer_id is not None else "unknown",
            viewer_role=viewer_role,
            mode=mode,
        )

        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(conversation_history)
        messages.append({"role": "user", "content": message})

        response = client.chat.completions.create(
            model=AI_MODEL,
            max_tokens=1500,
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=messages,
        )

        response_text = (response.choices[0].message.content or "").strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        elif response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        result = json.loads(response_text)

        return normalize_ai_response(result)

    except json.JSONDecodeError:
        return {
            "actions": [{"action": "NONE", "task": {}, "project": {}, "member": {}}],
            "reply": "I didn't quite catch that. Could you rephrase? 😊",
        }
    except Exception:
        return {
            "actions": [{"action": "NONE", "task": {}, "project": {}, "member": {}}],
            "reply": "I'm having trouble connecting right now. Please try again! 🔄",
        }


def normalize_ai_response(result: dict) -> dict:
    """Coerce the model's response into the canonical {actions: [...], reply: ...} shape.

    Older single-action responses (`{action, task, project, member, reply}`)
    are converted into a one-element actions array so downstream code only
    deals with one format.
    """
    if not isinstance(result, dict):
        return {
            "actions": [{"action": "NONE", "task": {}, "project": {}, "member": {}}],
            "reply": "I didn't quite catch that. Could you rephrase? 😊",
        }

    reply = result.get("reply") or "I'm not sure how to respond to that. 😊"

    raw_actions = result.get("actions")
    if not isinstance(raw_actions, list) or not raw_actions:
        # Fall back to legacy single-action format.
        legacy_action = result.get("action") or "NONE"
        raw_actions = [
            {
                "action": legacy_action,
                "task": result.get("task") or {},
                "project": result.get("project") or {},
                "member": result.get("member") or {},
            }
        ]

    normalized_actions = []
    for entry in raw_actions:
        if not isinstance(entry, dict):
            continue
        normalized_actions.append(
            {
                "action": entry.get("action") or "NONE",
                "task": entry.get("task") if isinstance(entry.get("task"), dict) else {},
                "project": entry.get("project") if isinstance(entry.get("project"), dict) else {},
                "member": entry.get("member") if isinstance(entry.get("member"), dict) else {},
            }
        )

    if not normalized_actions:
        normalized_actions = [{"action": "NONE", "task": {}, "project": {}, "member": {}}]

    return {"actions": normalized_actions, "reply": reply}
