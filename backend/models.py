from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    priority = Column(String, nullable=False, default="MEDIUM")
    status = Column(String, nullable=False, default="TODO")
    deadline = Column(String, nullable=True)
    category = Column(String, nullable=False, default="General")
    assignee = Column(String, nullable=True)
    asset_link = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
