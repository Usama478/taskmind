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
    assigned_to_user_id: Optional[int] = None


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
    assigned_to_user_id: Optional[int] = None


class TaskResponse(TaskBase):
    id: int
    created_at: datetime
    project_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class AssignedTaskResponse(TaskResponse):
    project_name: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GoogleAuthRequest(BaseModel):
    credential: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    picture: Optional[str] = None


class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime
    owner_id: int
    role: str = "OWNER"  # current viewer's role on the project

    model_config = ConfigDict(from_attributes=True)


class ProjectsListResponse(BaseModel):
    projects: list[ProjectResponse]
    total: int


class ProjectMemberResponse(BaseModel):
    id: int
    user_id: int
    role: str
    email: str
    name: str
    picture: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ProjectMembersListResponse(BaseModel):
    members: list[ProjectMemberResponse]
    total: int


class AddMemberRequest(BaseModel):
    email: str


class UserLookupResponse(BaseModel):
    found: bool
    user: Optional[UserResponse] = None


class AssignedTasksListResponse(BaseModel):
    tasks: list[AssignedTaskResponse]
    total: int


class ChatRequest(BaseModel):
    message: str
    project_id: int
    conversation_history: list[dict] = Field(default_factory=list)
    mode: str = "guided"  # "guided" | "auto"


class ChatResponse(BaseModel):
    reply: str
    action_taken: str
    task_affected: Optional[TaskResponse] = None
    project_affected: Optional[ProjectResponse] = None
    member_affected: Optional[ProjectMemberResponse] = None
    # Hints for the frontend about which lists became stale (e.g. ["projects",
    # "members", "tasks"]). The frontend can re-fetch only what's necessary.
    refresh: list[str] = Field(default_factory=list)
    tasks: list[TaskResponse]


class TasksListResponse(BaseModel):
    tasks: list[TaskResponse]
    total: int
    completed: int


class TaskHistoryResponse(BaseModel):
    id: int
    action: str
    task_id: Optional[int] = None
    task_title: str
    details: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskHistoryListResponse(BaseModel):
    history: list[TaskHistoryResponse]
    total: int


class CapabilityExample(BaseModel):
    label: str
    prompt: str


class CapabilityItem(BaseModel):
    action: str
    title: str
    description: str
    examples: list[CapabilityExample]


class CapabilitiesResponse(BaseModel):
    capabilities: list[CapabilityItem]
    quick_prompts: list[CapabilityExample]
