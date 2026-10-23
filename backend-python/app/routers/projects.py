from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import ReturnDocument

from app.database import Collections, new_document, to_object_id, utcnow
from app.dependencies import CurrentUser, Database, SocketServer, User, require_roles
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.serialization import to_json
from app.services.activity_logger import log_activity

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("")
async def get_projects(user: CurrentUser, db: Database):
    """Admins see projects of every team they own; everyone else sees their own team's projects."""
    if user.get("role") == "ADMIN":
        teams = await db[Collections.TEAMS].find({"adminId": user["_id"]}, {"_id": 1}).to_list()
        query = {"teamId": {"$in": [team["_id"] for team in teams]}}
    else:
        query = {"teamId": user.get("teamId")}

    projects = await db[Collections.PROJECTS].find(query).to_list()
    return to_json(projects)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    user: Annotated[User, Depends(require_roles("ADMIN", "MANAGER"))],
    db: Database,
    sio: SocketServer,
):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Project name is required")

    team_id = to_object_id(payload.teamId)
    if team_id is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid teamId")

    description = payload.description.strip() if payload.description is not None else None
    project = new_document(name=name, description=description, teamId=team_id)
    await db[Collections.PROJECTS].insert_one(project)

    await log_activity(
        db,
        action="PROJECT_CREATED",
        entity="PROJECT",
        entity_id=project["_id"],
        performed_by=user["_id"],
        team_id=team_id,
        metadata={"name": project["name"]},
    )

    data = to_json(project)
    await sio.emit("project-created", data, room=str(team_id))
    return data


@router.put("/{project_id}")
async def update_project(
    project_id: str,
    payload: ProjectUpdate,
    user: Annotated[User, Depends(require_roles("ADMIN", "MANAGER"))],
    db: Database,
    sio: SocketServer,
):
    changes: dict = {"updatedAt": utcnow()}
    if payload.name is not None:
        changes["name"] = payload.name.strip()
    if payload.description is not None:
        changes["description"] = payload.description.strip()

    project_oid = to_object_id(project_id)
    project = None
    if project_oid:
        project = await db[Collections.PROJECTS].find_one_and_update(
            {"_id": project_oid},
            {"$set": changes},
            return_document=ReturnDocument.AFTER,
        )
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")

    await log_activity(
        db,
        action="PROJECT_UPDATED",
        entity="PROJECT",
        entity_id=project["_id"],
        performed_by=user["_id"],
        team_id=project["teamId"],
        metadata={"name": project["name"]},
    )

    data = to_json(project)
    await sio.emit("project-updated", data, room=str(project["teamId"]))
    return data


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    user: Annotated[User, Depends(require_roles("ADMIN"))],
    db: Database,
    sio: SocketServer,
):
    project_oid = to_object_id(project_id)
    project = None
    if project_oid:
        project = await db[Collections.PROJECTS].find_one_and_delete({"_id": project_oid})
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")

    await log_activity(
        db,
        action="PROJECT_DELETED",
        entity="PROJECT",
        entity_id=project["_id"],
        performed_by=user["_id"],
        team_id=project["teamId"],
        metadata={"name": project["name"]},
    )

    await sio.emit(
        "project-deleted", {"projectId": str(project["_id"])}, room=str(project["teamId"])
    )
    return {"message": "Project deleted successfully"}
