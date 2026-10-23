from datetime import UTC, datetime

from bson import ObjectId

from app.serialization import to_json


def test_to_json_matches_mongoose_output() -> None:
    oid = ObjectId("65a1b2c3d4e5f6a7b8c9d0e1")
    doc = {
        "_id": oid,
        "createdAt": datetime(2026, 1, 2, 3, 4, 5, 678000, tzinfo=UTC),
        "naive": datetime(2026, 1, 2, 3, 4, 5),
        "nested": {"ids": [oid], "value": None},
    }

    assert to_json(doc) == {
        "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
        "createdAt": "2026-01-02T03:04:05.678Z",
        "naive": "2026-01-02T03:04:05.000Z",
        "nested": {"ids": ["65a1b2c3d4e5f6a7b8c9d0e1"], "value": None},
    }
