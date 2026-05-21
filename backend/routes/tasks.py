from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from auth import get_current_user
from crud import (
    create_task,
    delete_task,
    get_all_tasks,
    get_project_by_id,
    get_task_history,
    get_task_stats,
    get_tasks_assigned_to_user,
    update_task,
)
from database import get_db
from models import Project, User
from schemas import (
    AssignedTaskResponse,
    AssignedTasksListResponse,
    TaskCreate,
    TaskHistoryListResponse,
    TaskHistoryResponse,
    TaskResponse,
    TasksListResponse,
    TaskUpdate,
)

router = APIRouter()


def _require_project(db: Session, project_id: int, user_id: int):
    project = get_project_by_id(db, project_id, user_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("", response_model=TasksListResponse)
def list_tasks(
    project_id: int = Query(..., description="Active project ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_project(db, project_id, current_user.id)
    tasks = get_all_tasks(db, project_id)
    stats = get_task_stats(db, project_id)

    return TasksListResponse(
        tasks=tasks,
        total=stats["total"],
        completed=stats["completed"],
    )


@router.post("", response_model=TaskResponse)
def create_task_route(
    task: TaskCreate,
    project_id: int = Query(..., description="Active project ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_project(db, project_id, current_user.id)
    created = create_task(db, task, current_user.id, project_id)
    return TaskResponse.model_validate(created)


@router.get("/history", response_model=TaskHistoryListResponse)
def list_task_history(
    project_id: int | None = Query(None, description="Filter by project"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if project_id is not None:
        _require_project(db, project_id, current_user.id)
    entries = get_task_history(db, current_user.id, project_id)
    return TaskHistoryListResponse(
        history=[TaskHistoryResponse.model_validate(entry) for entry in entries],
        total=len(entries),
    )


@router.get("/assigned", response_model=AssignedTasksListResponse)
def list_assigned_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tasks assigned to the signed-in user across all projects."""
    tasks = get_tasks_assigned_to_user(db, current_user.id)

    project_ids = {t.project_id for t in tasks if t.project_id}
    name_by_project = {}
    if project_ids:
        projects = (
            db.query(Project).filter(Project.id.in_(project_ids)).all()
        )
        name_by_project = {p.id: p.name for p in projects}

    items = []
    for task in tasks:
        base = TaskResponse.model_validate(task).model_dump()
        base["project_name"] = name_by_project.get(task.project_id)
        items.append(AssignedTaskResponse(**base))

    return AssignedTasksListResponse(tasks=items, total=len(items))


@router.patch("/{task_id}")
def update_task_route(
    task_id: int,
    task_update: TaskUpdate,
    project_id: int = Query(..., description="Active project ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_project(db, project_id, current_user.id)
    updated_task = update_task(db, task_id, task_update, current_user.id, project_id)

    if updated_task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    return {
        "task": TaskResponse.model_validate(updated_task),
        "message": "Task updated successfully",
    }


@router.delete("/{task_id}")
def delete_task_route(
    task_id: int,
    project_id: int = Query(..., description="Active project ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_project(db, project_id, current_user.id)
    success = delete_task(db, task_id, current_user.id, project_id)

    if not success:
        raise HTTPException(status_code=404, detail="Task not found")

    return {
        "message": "Task deleted successfully",
        "id": task_id,
    }
