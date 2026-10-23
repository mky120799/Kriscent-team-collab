from pydantic import BaseModel

from app.schemas.common import TaskStatus


class TaskCreate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: TaskStatus = "todo"
    projectId: str | None = None
    assignedTo: str | None = None
    teamId: str | None = None


class TaskUpdate(BaseModel):
    status: TaskStatus | None = None
    assignedTo: str | None = None
