from sqlalchemy.orm import Session

from models import Task
from schemas import TaskCreate, TaskUpdate


def get_all_tasks(db: Session) -> list[Task]:
    return db.query(Task).order_by(Task.created_at.desc()).all()


def get_task_by_id(db: Session, task_id: int) -> Task | None:
    return db.query(Task).filter(Task.id == task_id).first()


def create_task(db: Session, task: TaskCreate) -> Task:
    new_task = Task(**task.model_dump())
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


def update_task(db: Session, task_id: int, updates: TaskUpdate) -> Task | None:
    task = get_task_by_id(db, task_id)
    if task is None:
        return None

    changes = updates.model_dump(exclude_unset=True, exclude_none=True)
    for field, value in changes.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task_id: int) -> bool:
    task = get_task_by_id(db, task_id)
    if task is None:
        return False

    db.delete(task)
    db.commit()
    return True


def get_task_stats(db: Session) -> dict:
    total = db.query(Task).count()
    completed = db.query(Task).filter(Task.status == "DONE").count()
    return {"total": total, "completed": completed}
