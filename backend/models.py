from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    picture = Column(String, nullable=True)
    google_sub = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="owner", foreign_keys="Task.user_id")
    assigned_tasks = relationship(
        "Task", back_populates="assignee_user", foreign_keys="Task.assigned_to_user_id"
    )
    chat_messages = relationship("ChatMessage", back_populates="owner")
    task_history = relationship("TaskHistory", back_populates="owner")
    memberships = relationship(
        "ProjectMember", back_populates="user", cascade="all, delete-orphan"
    )


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="projects")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="project", cascade="all, delete-orphan")
    members = relationship(
        "ProjectMember", back_populates="project", cascade="all, delete-orphan"
    )


class ProjectMember(Base):
    __tablename__ = "project_members"
    __table_args__ = (
        UniqueConstraint("project_id", "user_id", name="uq_project_member"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    role = Column(String, nullable=False, default="MEMBER")  # OWNER | MEMBER
    added_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="members")
    user = relationship("User", back_populates="memberships")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), index=True, nullable=True)
    assigned_to_user_id = Column(
        Integer, ForeignKey("users.id"), index=True, nullable=True
    )
    title = Column(String, nullable=False)
    priority = Column(String, nullable=False, default="MEDIUM")
    status = Column(String, nullable=False, default="TODO")
    deadline = Column(String, nullable=True)
    category = Column(String, nullable=False, default="General")
    assignee = Column(String, nullable=True)
    asset_link = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="tasks", foreign_keys=[user_id])
    assignee_user = relationship(
        "User", back_populates="assigned_tasks", foreign_keys=[assigned_to_user_id]
    )
    project = relationship("Project", back_populates="tasks")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), index=True, nullable=True)
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="chat_messages")
    project = relationship("Project", back_populates="chat_messages")


class TaskHistory(Base):
    __tablename__ = "task_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), index=True, nullable=True)
    # task_id may be null after the source task is deleted.
    task_id = Column(Integer, nullable=True, index=True)
    task_title = Column(String, nullable=False)
    action = Column(String, nullable=False)  # CREATED | UPDATED | COMPLETED | DELETED
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="task_history")
