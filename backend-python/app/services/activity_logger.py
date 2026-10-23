from typing import Any

from bson import ObjectId
from pymongo.asynchronous.database import AsyncDatabase

from app.database import Collections, new_document


async def log_activity(
    db: AsyncDatabase,
    *,
    action: str,
    entity: str,
    performed_by: ObjectId,
    team_id: ObjectId | None,
    entity_id: ObjectId | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    await db[Collections.ACTIVITY_LOGS].insert_one(
        new_document(
            action=action,
            entity=entity,
            entityId=entity_id,
            performedBy=performed_by,
            teamId=team_id,
            metadata=metadata,
        )
    )
