import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from starlette.middleware.sessions import SessionMiddleware

from app import database, firebase
from app.config import Settings
from app.errors import UnhandledErrorMiddleware, register_exception_handlers
from app.routers import activity, assistant, auth, messages, projects, tasks, teams, users
from app.security_headers import SecurityHeadersMiddleware
from app.sockets import create_socket_server

logger = logging.getLogger(__name__)

SESSION_MAX_AGE_SECONDS = 60 * 60 * 24  # 1 day


def create_fastapi_app(settings: Settings) -> FastAPI:
    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        firebase.init_firebase(settings)
        await database.connect(settings)
        yield
        await database.close()

    app = FastAPI(
        title="Kriscent Team Collab API",
        description="Team collaboration backend: projects, Kanban tasks, real-time chat and RBAC.",
        version="1.0.0",
        lifespan=lifespan,
    )
    app.state.settings = settings

    # Starlette runs the last-added middleware first, so CORS wraps everything else
    app.add_middleware(UnhandledErrorMiddleware)
    app.add_middleware(
        SessionMiddleware,
        secret_key=settings.session_secret,
        session_cookie="kriscent.sid",
        max_age=SESSION_MAX_AGE_SECONDS,
        same_site="none" if settings.is_production else "lax",
        https_only=settings.is_production,
    )
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info("CORS allowed origins: %s", settings.allowed_origins)

    register_exception_handlers(app)

    @app.get("/health", response_class=PlainTextResponse, include_in_schema=False)
    async def health() -> str:
        return "OK"

    for module in (auth, projects, tasks, messages, activity, users, teams, assistant):
        app.include_router(module.router)

    return app


def create_app(settings: Settings | None = None) -> socketio.ASGIApp:
    """Build the ASGI app: Socket.IO on /socket.io, everything else handled by FastAPI."""
    logging.basicConfig(level=logging.INFO, format="%(levelname)s:     %(name)s - %(message)s")
    settings = settings or Settings()
    fastapi_app = create_fastapi_app(settings)
    sio = create_socket_server(settings)
    fastapi_app.state.sio = sio
    return socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
