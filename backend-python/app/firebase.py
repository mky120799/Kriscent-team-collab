import asyncio
import logging
from typing import Any

import firebase_admin
from firebase_admin import auth, credentials

from app.config import Settings

logger = logging.getLogger(__name__)


def init_firebase(settings: Settings) -> None:
    if firebase_admin._apps:
        return

    logger.info(
        "Firebase initialization check: project_id=%s client_email=%s private_key=%s",
        bool(settings.firebase_project_id),
        bool(settings.firebase_client_email),
        bool(settings.firebase_private_key),
    )

    private_key = (settings.firebase_private_key or "").replace("\\n", "\n")
    credential = credentials.Certificate(
        {
            "type": "service_account",
            "project_id": settings.firebase_project_id,
            "client_email": settings.firebase_client_email,
            "private_key": private_key,
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    )
    firebase_admin.initialize_app(credential)


async def verify_id_token(token: str) -> dict[str, Any]:
    """Verify a Firebase ID token without blocking the event loop."""
    return await asyncio.to_thread(auth.verify_id_token, token)
