from datetime import UTC, datetime
from typing import Any

from bson import ObjectId


def to_json(value: Any) -> Any:
    """Convert MongoDB values into the JSON shape Mongoose's `toJSON` produces."""
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=UTC)
        iso = value.astimezone(UTC).isoformat(timespec="milliseconds")
        return iso.replace("+00:00", "Z")
    if isinstance(value, dict):
        return {key: to_json(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [to_json(item) for item in value]
    return value
