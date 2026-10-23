from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import ReturnDocument

from app.database import Collections, new_document, populate, to_object_id, utcnow
from app.dependencies import Database, SocketServer, User, get_current_user, require_roles
from app.schemas.task import TaskCreate, TaskUpdate
from app.serialization import to_json
from app.services.activity_logger import log_activity

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

ASSIGNEE_FIELDS = ["name", "email", "role"]


def _parse_id(value: str | None, field: str):
    """Parse an optional id from the request body; reject values that are present but malformed."""
    if value is None:
        return None
    oid = to_object_id(value)
    if oid is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid {field}")
    return oid


@router.get("", dependencies=[Depends(get_current_user)])
async def get_tasks(db: Database, projectId: str | None = None):
    project_id = to_object_id(projectId)
    if project_id is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or missing projectId")

    tasks = await db[Collections.TASKS].find({"projectId": project_id}).to_list()
    await populate(tasks, "assignedTo", db[Collections.USERS], ASSIGNEE_FIELDS)
    return to_json(tasks)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    user: Annotated[User, Depends(require_roles("ADMIN", "MANAGER"))],
    db: Database,
    sio: SocketServer,
):
    if not payload.projectId:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "ProjectId is required")
    if not payload.title:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Title is required")

    # Fall back to the creator's team when the client does not send one
    team_id = _parse_id(payload.teamId, "teamId") or user.get("teamId")
    if team_id is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "teamId is required")

    task = new_document(
        title=payload.title,
        description=payload.description,
        status=payload.status,
        projectId=_parse_id(payload.projectId, "projectId"),
        assignedTo=_parse_id(payload.assignedTo, "assignedTo"),
        teamId=team_id,
    )
    await db[Collections.TASKS].insert_one(task)

    await log_activity(
        db,
        action="TASK_CREATED",
        entity="TASK",
        entity_id=task["_id"],
        performed_by=user["_id"],
        team_id=team_id,
        metadata={"title": task["title"]},
    )

    data = to_json(task)
    await sio.emit("task-created", data, room=str(team_id))
    return data


@router.put("/{task_id}")
async def update_task(
    task_id: str,
    payload: TaskUpdate,
    user: Annotated[User, Depends(require_roles("ADMIN", "MANAGER", "MEMBER"))],
    db: Database,
    sio: SocketServer,
):
    """Update a task's status or assignee. Members may do this too, e.g. to move a card."""
    changes: dict = {"updatedAt": utcnow()}
    if payload.status is not None:
        changes["status"] = payload.status
    if payload.assignedTo is not None:
        changes["assignedTo"] = _parse_id(payload.assignedTo, "assignedTo")

    task_oid = to_object_id(task_id)
    task = None
    if task_oid:
        task = await db[Collections.TASKS].find_one_and_update(
            {"_id": task_oid},
            {"$set": changes},
            return_document=ReturnDocument.AFTER,
        )
    if task is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task find failed")

    await populate([task], "assignedTo", db[Collections.USERS], ASSIGNEE_FIELDS)

    data = to_json(task)
    team_id = task.get("teamId") or user.get("teamId")
    if team_id:
        await sio.emit("task-updated", data, room=str(team_id))
    return data


@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    user: Annotated[User, Depends(require_roles("ADMIN", "MANAGER"))],
    db: Database,
    sio: SocketServer,
):
    task_oid = to_object_id(task_id)
    task = None
    if task_oid:
        task = await db[Collections.TASKS].find_one_and_delete({"_id": task_oid})
    if task is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")

    team_id = task.get("teamId") or user.get("teamId")
    if team_id:
        await sio.emit("task-deleted", {"taskId": str(task["_id"])}, room=str(team_id))
    return {"message": "Task deleted successfully"}
