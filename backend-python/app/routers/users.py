import re
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from pymongo import ReturnDocument

from app.database import Collections, new_document, to_object_id, utcnow
from app.dependencies import CurrentUser, Database, get_current_user, require_roles
from app.schemas.common import ROLES
from app.schemas.user import ProfileUpdate, RoleUpdate, UserCreate
from app.serialization import to_json

router = APIRouter(prefix="/api/users", tags=["users"])

USER_LIST_FIELDS = {"name": 1, "email": 1, "role": 1, "teamId": 1}


@router.get("", dependencies=[Depends(get_current_user)])
async def get_users(
    db: Database,
    projectId: str | None = None,
    search: str | None = None,
):
    """List users, optionally limited to a project's team and/or a name/email search."""
    filters: list[dict[str, Any]] = []

    if projectId:
        project_id = to_object_id(projectId)
        project = await db[Collections.PROJECTS].find_one({"_id": project_id}) if project_id else None
        if project is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")

        team = await db[Collections.TEAMS].find_one({"_id": project["teamId"]})
        if team:
            # Team members plus the team's admin, who may not be a member
            filters.append({"$or": [{"teamId": project["teamId"]}, {"_id": team["adminId"]}]})
        else:
            filters.append({"teamId": project["teamId"]})

    if search:
        pattern = {"$regex": re.escape(search), "$options": "i"}
        filters.append({"$or": [{"name": pattern}, {"email": pattern}]})

    query = {"$and": filters} if filters else {}
    users = await db[Collections.USERS].find(query, USER_LIST_FIELDS).to_list()
    return to_json(users)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_user(payload: UserCreate, db: Database):
    """Register a user after Firebase sign-up. The very first user becomes ADMIN with a default team."""
    users = db[Collections.USERS]

    existing = await users.find_one({"firebaseUid": payload.firebaseUid})
    if existing:
        return JSONResponse(to_json(existing), status_code=status.HTTP_200_OK)

    is_first_user = await users.count_documents({}) == 0
    user_id = ObjectId()
    team_id = None

    if is_first_user:
        team = new_document(
            name="Default Team",
            description="Auto-created team for first admin",
            adminId=user_id,
        )
        result = await db[Collections.TEAMS].insert_one(team)
        team_id = result.inserted_id

    user = new_document(
        _id=user_id,
        firebaseUid=payload.firebaseUid,
        email=payload.email,
        name=payload.name,
        role="ADMIN" if is_first_user else "MEMBER",
        teamId=team_id,
    )
    await users.insert_one(user)

    return {
        "_id": str(user_id),
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "teamId": str(team_id) if team_id else None,
        "firebaseUid": user["firebaseUid"],
    }


@router.patch("/profile")
async def update_profile(payload: ProfileUpdate, user: CurrentUser, db: Database):
    if not payload.name:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Name is required")

    updated = await db[Collections.USERS].find_one_and_update(
        {"_id": user["_id"]},
        {"$set": {"name": payload.name, "updatedAt": utcnow()}},
        return_document=ReturnDocument.AFTER,
    )
    if updated is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    return {"message": "Profile updated successfully", "user": to_json(updated)}


@router.patch("/{user_id}/role", dependencies=[Depends(require_roles("ADMIN"))])
async def update_user_role(user_id: str, payload: RoleUpdate, db: Database):
    if payload.role not in ROLES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid role")

    target_id = to_object_id(user_id)
    updated = None
    if target_id:
        updated = await db[Collections.USERS].find_one_and_update(
            {"_id": target_id},
            {"$set": {"role": payload.role, "updatedAt": utcnow()}},
            return_document=ReturnDocument.AFTER,
        )
    if updated is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    return {"message": "User role updated successfully", "user": to_json(updated)}
