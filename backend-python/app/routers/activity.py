from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse

from app.database import Collections, populate, to_object_id
from app.dependencies import Database, User, require_roles
from app.serialization import to_json

router = APIRouter(prefix="/api/activity", tags=["activity"])


@router.get("")
async def get_activity(
    user: Annotated[User, Depends(require_roles("ADMIN", "MANAGER"))],
    db: Database,
    teamId: str | None = None,
):
    """Return a team's activity log, newest first. Defaults to the user's own team."""
    target_team_id = to_object_id(teamId) if teamId else user.get("teamId")
    if not target_team_id:
        return JSONResponse(
            {"error": "Missing user or teamId"}, status_code=status.HTTP_400_BAD_REQUEST
        )

    logs = (
        await db[Collections.ACTIVITY_LOGS]
        .find({"teamId": target_team_id})
        .sort("createdAt", -1)
        .to_list()
    )
    await populate(logs, "performedBy", db[Collections.USERS], ["name", "email"])
    return to_json(logs)
