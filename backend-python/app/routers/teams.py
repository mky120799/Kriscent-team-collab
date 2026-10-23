from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import ReturnDocument

from app.database import Collections, new_document, to_object_id, utcnow
from app.dependencies import CurrentUser, Database, get_current_user
from app.schemas.common import ROLES
from app.schemas.team import AddMemberRequest, TeamCreate
from app.serialization import to_json

router = APIRouter(prefix="/api/teams", tags=["teams"])


@router.get("")
async def get_teams(user: CurrentUser, db: Database):
    """Admins see the teams they own; everyone else sees the team they belong to."""
    if user.get("role") == "ADMIN":
        query = {"adminId": user["_id"]}
    else:
        query = {"_id": user.get("teamId")}

    teams = await db[Collections.TEAMS].find(query).to_list()
    return to_json(teams)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_team(payload: TeamCreate, user: CurrentUser, db: Database):
    if user.get("role") != "ADMIN":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only Admins can create teams")
    if not payload.name:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Team name is required")

    team = new_document(name=payload.name, description=payload.description, adminId=user["_id"])
    await db[Collections.TEAMS].insert_one(team)
    return to_json(team)


@router.get("/{team_id}/members", dependencies=[Depends(get_current_user)])
async def get_team_members(team_id: str, db: Database):
    team_oid = to_object_id(team_id)
    if team_oid is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid teamId")

    members = await db[Collections.USERS].find(
        {"teamId": team_oid}, {"name": 1, "email": 1, "role": 1}
    ).to_list()
    return to_json(members)


@router.post("/{team_id}/members", dependencies=[Depends(get_current_user)])
async def add_team_member(team_id: str, payload: AddMemberRequest, db: Database):
    team_oid = to_object_id(team_id)
    user_oid = to_object_id(payload.userId)
    if team_oid is None or user_oid is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid teamId or userId")

    changes = {"teamId": team_oid, "updatedAt": utcnow()}
    if payload.role in ROLES:
        changes["role"] = payload.role

    member = await db[Collections.USERS].find_one_and_update(
        {"_id": user_oid},
        {"$set": changes},
        return_document=ReturnDocument.AFTER,
    )
    if member is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    return {"message": "Member added successfully", "user": to_json(member)}
