import logging
from typing import Any

import socketio

from app import firebase
from app.config import Settings
from app.database import Collections, get_db

logger = logging.getLogger(__name__)


def create_socket_server(settings: Settings) -> socketio.AsyncServer:
    sio = socketio.AsyncServer(
        async_mode="asgi",
        cors_allowed_origins=settings.allowed_origins,
    )

    @sio.event
    async def connect(sid: str, environ: dict[str, Any], auth: dict[str, Any] | None) -> None:
        token = (auth or {}).get("token")
        if not token:
            raise socketio.exceptions.ConnectionRefusedError("No token provided")

        try:
            decoded = await firebase.verify_id_token(token)
            user = await get_db()[Collections.USERS].find_one({"firebaseUid": decoded["uid"]})
        except Exception:
            raise socketio.exceptions.ConnectionRefusedError("Unauthorized")

        if user is None:
            raise socketio.exceptions.ConnectionRefusedError("User not found")

        await sio.save_session(sid, {"user": user})
        logger.info("Socket connected: %s", user["email"])

        # Auto-join the user's own team room
        if user.get("teamId"):
            await sio.enter_room(sid, str(user["teamId"]))

    @sio.on("join-room")
    async def join_room(sid: str, team_id: Any) -> None:
        """Join another team's room, e.g. when an admin switches teams."""
        if not team_id:
            return
        target_room = str(team_id)
        session = await sio.get_session(sid)
        user = session["user"]

        user_team_id = str(user["teamId"]) if user.get("teamId") else None
        if user.get("role") == "ADMIN" or user_team_id == target_room:
            await sio.enter_room(sid, target_room)
            logger.info("User %s joined room: %s", user["email"], target_room)

    @sio.event
    async def disconnect(sid: str, reason: Any = None) -> None:
        session = await sio.get_session(sid)
        user = session.get("user")
        if user:
            logger.info("Socket disconnected: %s", user["email"])

    return sio
