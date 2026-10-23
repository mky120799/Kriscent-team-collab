import logging
from datetime import UTC, datetime
from typing import Any

from bson import ObjectId
from pymongo import ASCENDING, AsyncMongoClient
from pymongo.asynchronous.collection import AsyncCollection
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.errors import OperationFailure

from app.config import Settings

logger = logging.getLogger(__name__)


class Collections:
    """Collection names, kept identical to the ones Mongoose created."""

    USERS = "users"
    TEAMS = "teams"
    PROJECTS = "projects"
    TASKS = "tasks"
    MESSAGES = "messages"
    ACTIVITY_LOGS = "activitylogs"


_client: AsyncMongoClient | None = None
_db: AsyncDatabase | None = None


async def connect(settings: Settings) -> None:
    global _client, _db
    _client = AsyncMongoClient(settings.mongo_uri, tz_aware=True)
    await _client.admin.command("ping")
    _db = _client[settings.mongo_db_name]
    await _ensure_indexes(_db)
    logger.info("MongoDB connected (database: %s)", settings.mongo_db_name)


async def close() -> None:
    global _client, _db
    if _client is not None:
        await _client.close()
    _client = None
    _db = None


def get_db() -> AsyncDatabase:
    if _db is None:
        raise RuntimeError("Database is not connected")
    return _db


async def _ensure_indexes(db: AsyncDatabase) -> None:
    users = db[Collections.USERS]
    for field in ("firebaseUid", "email"):
        try:
            await users.create_index([(field, ASCENDING)], unique=True)
        except OperationFailure as exc:
            # An equivalent index created by Mongoose may already exist
            logger.warning("Could not create unique index on users.%s: %s", field, exc)


def utcnow() -> datetime:
    return datetime.now(UTC)


def new_document(**fields: Any) -> dict[str, Any]:
    """Build a document the way Mongoose does: drop unset fields, add timestamps and `__v`."""
    now = utcnow()
    doc = {key: value for key, value in fields.items() if value is not None}
    return {**doc, "createdAt": now, "updatedAt": now, "__v": 0}


def to_object_id(value: Any) -> ObjectId | None:
    """Return the value as an ObjectId, or None when it is not a valid id."""
    if isinstance(value, ObjectId):
        return value
    if isinstance(value, str) and ObjectId.is_valid(value):
        return ObjectId(value)
    return None


async def populate(
    docs: list[dict[str, Any]],
    field: str,
    collection: AsyncCollection,
    fields: list[str],
) -> list[dict[str, Any]]:
    """Replace ObjectId references in `field` with the referenced documents, like Mongoose's `populate`."""
    ids = {doc[field] for doc in docs if isinstance(doc.get(field), ObjectId)}
    if not ids:
        return docs

    projection = {name: 1 for name in fields}
    cursor = collection.find({"_id": {"$in": list(ids)}}, projection)
    found = {ref["_id"]: ref async for ref in cursor}

    for doc in docs:
        ref_id = doc.get(field)
        if isinstance(ref_id, ObjectId):
            doc[field] = found.get(ref_id)
    return docs
