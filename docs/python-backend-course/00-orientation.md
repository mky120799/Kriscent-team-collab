# Chapter 0 — Orientation and the Project Map

## Goal

Become comfortable navigating a real Python service before learning individual libraries.

## What this project contains

- FastAPI and Uvicorn for HTTP and ASGI;
- MongoDB through PyMongo’s native async API;
- Pydantic v2 for request validation;
- Firebase Admin SDK for bearer-token verification;
- role-based access control for admin, manager, and member actions;
- `python-socketio` for team rooms and realtime updates;
- Gemini through `httpx`, with a deterministic rule-based fallback;
- pytest and pytest-asyncio for unit, API, and Socket.IO tests.

## Read the repository in this order

1. [`app/main.py`](../../backend-python/app/main.py): app factory, lifespan, middleware, and routers.
2. [`app/config.py`](../../backend-python/app/config.py): typed environment configuration.
3. [`app/dependencies.py`](../../backend-python/app/dependencies.py): authentication and RBAC dependencies.
4. [`app/database.py`](../../backend-python/app/database.py): MongoDB lifecycle and helpers.
5. [`app/schemas/`](../../backend-python/app/schemas/): request contracts and enums.
6. [`app/routers/tasks.py`](../../backend-python/app/routers/tasks.py): a complete CRUD and realtime feature.
7. [`app/services/activity_logger.py`](../../backend-python/app/services/activity_logger.py): cross-feature side effects.
8. [`app/services/assistant.py`](../../backend-python/app/services/assistant.py): external API plus fallback behavior.
9. [`app/sockets.py`](../../backend-python/app/sockets.py): realtime authentication and rooms.
10. [`tests/test_api.py`](../../backend-python/tests/test_api.py): API behavior and permissions.

## First investigation

Trace `POST /api/tasks` for an authenticated manager:

1. FastAPI matches the route in `routers/tasks.py`.
2. Pydantic parses the request body into `TaskCreate`.
3. `require_roles` authenticates the user and checks the role.
4. The router validates ids and writes the task to MongoDB.
5. Activity is logged.
6. The serialized task is emitted to the team’s Socket.IO room.
7. The response returns the task shape to the frontend.

## Checkpoint

Run the API and open `http://localhost:5555/docs`. Explain what happens for a valid request, a missing bearer token, an invalid ObjectId, and a member trying to create a task.
