import asyncio
import socket
from collections.abc import AsyncIterator

import httpx
import pytest
import socketio
import uvicorn

from app.config import Settings
from app.main import create_app
from tests.conftest import auth, register


def free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


@pytest.fixture
async def server_url(settings: Settings) -> AsyncIterator[str]:
    """Run the real app (with lifespan) on a local port."""
    port = free_port()
    server = uvicorn.Server(
        uvicorn.Config(create_app(settings), host="127.0.0.1", port=port, log_level="warning")
    )
    task = asyncio.create_task(server.serve())
    while not server.started:
        await asyncio.sleep(0.05)
    yield f"http://127.0.0.1:{port}"
    server.should_exit = True
    await task


async def test_chat_message_is_broadcast_to_team_room(server_url: str) -> None:
    async with httpx.AsyncClient(base_url=server_url) as client:
        admin = await register(client, "alice")
        received: asyncio.Queue = asyncio.Queue()

        sio = socketio.AsyncClient()
        sio.on("new-message", received.put_nowait)
        await sio.connect(server_url, auth={"token": "token-alice"}, transports=["websocket"])
        try:
            response = await client.post(
                "/api/messages",
                headers=auth("alice"),
                json={"content": "Hi", "teamId": admin["teamId"]},
            )
            message = await asyncio.wait_for(received.get(), timeout=5)
            assert message == response.json()
        finally:
            await sio.disconnect()


async def test_socket_rejects_invalid_token(server_url: str) -> None:
    errors: list = []
    sio = socketio.AsyncClient()
    sio.on("connect_error", errors.append)
    with pytest.raises(socketio.exceptions.ConnectionError):
        await sio.connect(server_url, auth={"token": "bad"}, transports=["websocket"])
    assert errors == [{"message": "Unauthorized"}]
