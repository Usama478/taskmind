from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from crud import delete_task, get_all_tasks, get_task_by_id, get_task_stats, update_task
from database import get_db
from schemas import TaskResponse, TasksListResponse, TaskUpdate

router = APIRouter()


@router.get("/", response_model=TasksListResponse)
def list_tasks(db: Session = Depends(get_db)):
    """
    Get all tasks with total count and completed count.
    """
    tasks = get_all_tasks(db)
    stats = get_task_stats(db)
    
    return TasksListResponse(
        tasks=tasks,
        total=stats["total"],
        completed=stats["completed"]
    )


@router.patch("/{task_id}")
def update_task_route(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing task by ID.
    """
    updated_task = update_task(db, task_id, task_update)
    
    if updated_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {
        "task": TaskResponse.model_validate(updated_task),
        "message": "Task updated successfully"
    }


@router.delete("/{task_id}")
def delete_task_route(task_id: int, db: Session = Depends(get_db)):
    """
    Delete a task by ID.
    """
    success = delete_task(db, task_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {
        "message": "Task deleted successfully",
        "id": task_id
    }
