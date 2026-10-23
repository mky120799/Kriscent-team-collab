import logging

from fastapi import APIRouter, HTTPException, Request, status

from app import firebase
from app.database import Collections
from app.dependencies import CurrentUser, Database
from app.schemas.auth import LoginRequest
from app.serialization import to_json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
async def login(payload: LoginRequest, request: Request, db: Database):
    """Verify a Firebase ID token, start a session and return the user."""
    if not payload.idToken:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No token provided")

    try:
        decoded = await firebase.verify_id_token(payload.idToken)
        user = await db[Collections.USERS].find_one({"firebaseUid": decoded["uid"]})
    except Exception:
        logger.exception("Login failed")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Login failed")

    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")

    request.session["user"] = {
        "id": str(user["_id"]),
        "email": user["email"],
        "role": user.get("role"),
        "teamId": str(user["teamId"]) if user.get("teamId") else None,
    }

    return {"user": to_json(user)}


@router.get("/me")
async def get_me(user: CurrentUser):
    """Return the current user so the frontend can rehydrate its state."""
    return {"user": to_json(user)}
