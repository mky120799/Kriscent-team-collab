import logging
from collections.abc import Awaitable, Callable
from typing import Annotated, Any

import socketio
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pymongo.asynchronous.database import AsyncDatabase

from app import firebase
from app.config import Settings
from app.database import Collections, get_db
from app.schemas.common import Role

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer(auto_error=False)

Database = Annotated[AsyncDatabase, Depends(get_db)]
User = dict[str, Any]


async def get_current_user(
    db: Database,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> User:
    """Authenticate the request with the Firebase ID token in the Authorization header."""
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Unauthorized: No token provided")

    try:
        decoded = await firebase.verify_id_token(credentials.credentials)
        user = await db[Collections.USERS].find_one({"firebaseUid": decoded["uid"]})
    except Exception:
        logger.exception("Auth error")
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Unauthorized: Invalid token")

    if user is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Unauthorized: User not found in database"
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*roles: Role) -> Callable[..., Awaitable[User]]:
    """Dependency factory that only lets users with one of `roles` through."""

    async def check_role(user: CurrentUser) -> User:
        if user.get("role") not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Forbidden")
        return user

    return check_role


def get_sio(request: Request) -> socketio.AsyncServer:
    return request.app.state.sio


SocketServer = Annotated[socketio.AsyncServer, Depends(get_sio)]


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


AppSettings = Annotated[Settings, Depends(get_settings)]
