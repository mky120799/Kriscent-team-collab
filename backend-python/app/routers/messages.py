import logging

from fastapi import APIRouter, HTTPException, status

from app.database import Collections, new_document, populate, to_object_id
from app.dependencies import CurrentUser, Database, SocketServer
from app.schemas.message import MessageCreate
from app.serialization import to_json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/messages", tags=["messages"])

MESSAGE_HISTORY_LIMIT = 100


@router.get("")
async def get_messages(user: CurrentUser, db: Database, teamId: str | None = None):
    """Return the latest chat history for a team the user belongs to (admins can read any team)."""
    if not teamId:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "teamId is required")

    user_team_id = str(user["teamId"]) if user.get("teamId") else None
    if user.get("role") != "ADMIN" and user_team_id != teamId:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Forbidden: You are not a member of this team"
        )

    team_oid = to_object_id(teamId)
    if team_oid is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid teamId")

    messages = (
        await db[Collections.MESSAGES]
        .find({"teamId": team_oid})
        .sort("createdAt", 1)
        .limit(MESSAGE_HISTORY_LIMIT)
        .to_list()
    )
    await populate(messages, "senderId", db[Collections.USERS], ["name"])
    return to_json(messages)


@router.post("", status_code=status.HTTP_201_CREATED)
async def send_message(payload: MessageCreate, user: CurrentUser, db: Database, sio: SocketServer):
    content = (payload.content or "").strip()
    if not content or not payload.teamId:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Content and teamId are required")

    team_oid = to_object_id(payload.teamId)
    if team_oid is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid teamId")

    message = new_document(content=content, senderId=user["_id"], teamId=team_oid)
    await db[Collections.MESSAGES].insert_one(message)

    # The sender is already known, so attach it directly instead of re-querying
    data = to_json(
        {**message, "senderId": {"_id": user["_id"], "name": user.get("name") or "Unknown User"}}
    )

    try:
        await sio.emit("new-message", data, room=str(team_oid))
    except Exception:
        logger.exception("Socket broadcast failed")

    return data
