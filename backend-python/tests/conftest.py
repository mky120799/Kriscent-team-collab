import os
import uuid
from collections.abc import AsyncIterator
from typing import Any
from unittest.mock import AsyncMock

import httpx
import pytest
from pymongo import AsyncMongoClient
from pymongo.errors import PyMongoError

from app import database, firebase
from app.config import Settings
from app.main import create_app

TEST_MONGO_URI = os.environ.get("TEST_MONGO_URI", "mongodb://localhost:27017")


async def fake_verify_id_token(token: str) -> dict[str, Any]:
    """Accept tokens of the form 'token-<uid>' instead of real Firebase ID tokens."""
    if not token.startswith("token-"):
        raise ValueError("invalid token")
    return {"uid": token.removeprefix("token-")}


@pytest.fixture(autouse=True)
def fake_firebase(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(firebase, "verify_id_token", fake_verify_id_token)
    monkeypatch.setattr(firebase, "init_firebase", lambda settings: None)


@pytest.fixture
async def settings() -> AsyncIterator[Settings]:
    try:
        probe = AsyncMongoClient(TEST_MONGO_URI, serverSelectionTimeoutMS=1000)
        await probe.admin.command("ping")
    except PyMongoError:
        pytest.skip(f"MongoDB is not reachable at {TEST_MONGO_URI}")

    db_name = f"kriscent_test_{uuid.uuid4().hex[:8]}"
    yield Settings(
        _env_file=None,
        mongo_uri=TEST_MONGO_URI,
        mongo_db_name=db_name,
        session_secret="test-secret",
        gemini_api_key=None,
    )
    await probe.drop_database(db_name)
    await probe.close()


@pytest.fixture
async def app(settings: Settings):
    asgi_app = create_app(settings)
    await database.connect(settings)
    yield asgi_app
    await database.close()


@pytest.fixture
def emit(app) -> AsyncMock:
    """Replace Socket.IO broadcasts with a mock so tests can assert on them."""
    mock = AsyncMock()
    app.other_asgi_app.state.sio.emit = mock
    return mock


@pytest.fixture
async def client(app) -> AsyncIterator[httpx.AsyncClient]:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


def auth(uid: str) -> dict[str, str]:
    return {"Authorization": f"Bearer token-{uid}"}


async def register(client: httpx.AsyncClient, uid: str, name: str | None = None) -> dict:
    response = await client.post(
        "/api/users",
        json={"firebaseUid": uid, "name": name or uid.title(), "email": f"{uid}@example.com"},
    )
    assert response.status_code == 201, response.text
    return response.json()
