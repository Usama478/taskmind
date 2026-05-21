from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class TaskBase(BaseModel):
    title: str
    priority: str = "MEDIUM"
    status: str = "TODO"
    deadline: Optional[str] = None
    category: str = "General"
    assignee: Optional[str] = None
    asset_link: Optional[str] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[str] = None
    category: Optional[str] = None
    assignee: Optional[str] = None
    asset_link: Optional[str] = None


class TaskResponse(TaskBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatRequest(BaseModel):
    message: str
    conversation_history: list[dict] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
    action_taken: str
    task_affected: Optional[TaskResponse] = None
    tasks: list[TaskResponse]


class TasksListResponse(BaseModel):
    tasks: list[TaskResponse]
    total: int
    completed: int
