# Chapter 4 — FastAPI Fundamentals

## Goal

Build a request handler that is validated, authenticated, observable, and testable.

## Learn these building blocks in order

1. `FastAPI()` and `APIRouter`.
2. Path, query, and body parameters.
3. Pydantic request models.
4. `Depends()` for shared behavior.
5. `Annotated` for readable dependency types.
6. Middleware for cross-cutting HTTP behavior.
7. Lifespan startup and shutdown hooks.
8. Exception handlers and consistent error responses.
9. OpenAPI tags and generated API documentation.

The app factory in [`app/main.py`](../../backend-python/app/main.py) creates FastAPI, registers middleware and exception handlers, mounts routers, initializes Firebase and MongoDB in the lifespan, and wraps the service with Socket.IO.

## A real endpoint from contract to test

The task endpoint is a better learning example than a toy route because it combines validation, dependencies, persistence, serialization, and a side effect.

### Request model

```python
# app/schemas/task.py
from pydantic import BaseModel
from app.schemas.common import TaskStatus


class TaskUpdate(BaseModel):
    status: TaskStatus | None = None
    assignedTo: str | None = None
```

### Router

```python
# app/routers/tasks.py
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import ReturnDocument

from app.database import Collections, to_object_id, utcnow
from app.dependencies import Database, SocketServer, User, require_roles
from app.schemas.task import TaskUpdate

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.put("/{task_id}")
async def update_task(
    task_id: str,
    payload: TaskUpdate,
    user: Annotated[User, Depends(require_roles("ADMIN", "MANAGER", "MEMBER"))],
    db: Database,
    sio: SocketServer,
):
    changes: dict = {"updatedAt": utcnow()}
    if payload.status is not None:
        changes["status"] = payload.status
    task_oid = to_object_id(task_id)
    if task_oid is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task find failed")
    task = await db[Collections.TASKS].find_one_and_update(
        {"_id": task_oid},
        {"$set": changes},
        return_document=ReturnDocument.AFTER,
    )
    if task is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task find failed")
    return task
```

The complete implementation is [`app/routers/tasks.py`](../../backend-python/app/routers/tasks.py). The shortened example highlights the dependency graph; read the real function for malformed-ID handling, assignee parsing, population, `to_json`, and the `task-updated` event.

### Register and test

```python
from app.routers import tasks

app.include_router(tasks.router)
```

```python
async def test_member_can_move_task(client, emit):
    # Arrange a team, project, and task; see test_task_lifecycle for the full setup.
    response = await client.put(
        f"/api/tasks/{task_id}",
        headers=auth("bob"),
        json={"status": "in-progress"},
    )

    assert response.status_code == 200
```

This snippet assumes a `task_id` and authenticated Bob created in test setup. Read [`test_task_lifecycle`](../../backend-python/tests/test_api.py) for that setup, the role difference, populated assignee, and Socket.IO assertion.

## Understand the parameter sources

In the update signature, `task_id: str` comes from the URL path because the router path contains `{task_id}`. `payload: TaskUpdate` comes from the JSON body because it is a Pydantic model. `user`, `db`, and `sio` come from dependencies. FastAPI resolves dependencies before entering the function body. A missing token therefore fails before the MongoDB update is attempted.

The `TaskStatus` literal checks values such as `"in-progress"`. The project registers a custom `RequestValidationError` handler that returns `400` with `{"message": ...}` instead of FastAPI's usual `422` error shape. This matters to the React client, which expects the same error envelope from both backend implementations.

## Trace a complete update

1. Router matches `PUT /api/tasks/{task_id}`.
2. Pydantic validates `TaskUpdate`; dependencies verify the Firebase token, look up the user, and check the role.
3. The handler builds `changes` with a UTC `updatedAt` and supplied fields.
4. `to_object_id` converts the path ID; MongoDB `find_one_and_update` applies `$set` and returns the updated document.
5. `populate` loads the assignee's selected public fields; `to_json` converts BSON values.
6. Socket.IO emits `task-updated` to a team room; the route returns the serialized task.

The existing route does not check cross-team ownership before updating. The sequence above describes current behavior, not a complete security policy. See [Firebase and RBAC](technology-deep-dives/04-firebase-auth.md) for the missing scope check.

## Checkpoint

Trace `PUT /api/tasks/{task_id}` from request to response. Add a test for one missing or malformed value, one unauthenticated request, and one emitted event. Then explain why `Depends(require_roles(...))` is authorization while `TaskUpdate` is validation.

## Deep reading: why the handler signature works

Consider the real update route in [`app/routers/tasks.py`](../../backend-python/app/routers/tasks.py):

```python
async def update_task(
    task_id: str,
    payload: TaskUpdate,
    user: Annotated[User, Depends(require_roles("ADMIN", "MANAGER", "MEMBER"))],
    db: Database,
    sio: SocketServer,
):
    ...
```

FastAPI does not call this function with five positional values from your code. It constructs the arguments from the request and dependency graph:

| Parameter | Source | Failure before handler body? |
| --- | --- | --- |
| `task_id` | `{task_id}` path segment | Missing path does not match route |
| `payload` | Parsed JSON body converted to `TaskUpdate` | Invalid status becomes custom `400` response |
| `user` | `require_roles`, which depends on `get_current_user` | Missing/invalid token `401`; disallowed role `403` |
| `db` | `get_db` through the `Database` alias | Disconnected database raises before route can query |
| `sio` | `get_sio`, reading `request.app.state.sio` | Misconfigured app state fails before emit |

`Annotated[T, Depends(factory)]` retains `T` for type understanding while supplying metadata that tells FastAPI how to obtain it. `require_roles(...)` is a **dependency factory**: calling it when routes are registered creates a `check_role` function; FastAPI invokes that function per request. Its own `CurrentUser` argument causes token verification and local-user lookup before the role check. Read [`app/dependencies.py`](../../backend-python/app/dependencies.py) and draw arrows from `update_task` to `check_role` to `get_current_user` to MongoDB/Firebase.

## Execution order and short circuits

The route body starts only after request parsing and dependencies succeed. With a member who has a valid token, `require_roles` permits the update. The handler then builds a changes dictionary. For `{"status": "done"}`, it includes `updatedAt` and `status`; for `{}`, it currently includes only `updatedAt`, so a nominally empty update still writes. That is current behavior; decide whether empty updates should be rejected in a future contract.

The path ID is converted using `to_object_id`. A malformed ID is never sent into an ObjectId query. The current update route returns `404` if conversion fails or no task matches. That differs from the list route's `400` for an invalid `projectId`. Read the tests before changing either response. After a match, `populate` mutates the returned task's `assignedTo` into a user summary. `to_json` then converts any remaining ObjectIds and timestamps into JSON-safe values. Finally `sio.emit` sends the serialized data and the function returns it.

## Where middleware runs

Middleware wraps the route/dependency work. In [`app/main.py`](../../backend-python/app/main.py), CORS is registered last so it is outermost among the FastAPI middleware. The custom error handlers in [`app/errors.py`](../../backend-python/app/errors.py) turn expected HTTP errors and Pydantic validation errors into `{"message": ...}`. `UnhandledErrorMiddleware` catches unexpected exceptions and returns a `500`. It currently includes the exception string in that response; that is a production hardening issue, not a pattern to copy.

The `/health` route is deliberately excluded from OpenAPI and returns plain text. `/docs` is generated from the route registrations and request models. It documents syntax and shapes; it cannot prove resource-level authorization. A route can look correct in `/docs` and still allow cross-team task updates if its MongoDB query is not scoped.

## Work it through with a test client

[`tests/conftest.py`](../../backend-python/tests/conftest.py) constructs the ASGI app, connects a temporary MongoDB database, and gives HTTPX an `ASGITransport`. A test sends a request to the app without starting a network server:

```python
response = await client.put(
    f"/api/tasks/{task_id}",
    headers=auth("bob"),
    json={"status": "in-progress"},
)
assert response.status_code == 200
assert response.json()["status"] == "in-progress"
```

The fake Firebase verifier turns `token-bob` into `uid="bob"`; the dependency still loads Bob's local MongoDB user and checks his role. The `emit` fixture replaces Socket.IO broadcasting with `AsyncMock`. Assert the event name, serialized payload, and room separately. This test covers FastAPI parsing, dependency wiring, MongoDB write, serialization, and the intended emit call. It does not prove a real socket client receives the event; `tests/test_socket.py` covers that boundary.

## Practice questions with answers to check yourself

1. **Why does `db: Database` work without `Depends` in the route?** `Database` is already an `Annotated[AsyncDatabase, Depends(get_db)]` alias.
2. **Can a valid Firebase token alone grant `MANAGER` rights?** No. The role comes from the local user document looked up by `firebaseUid`.
3. **Does a `MEMBER` role prove Bob may update any task?** No. Role and resource scope are separate; the current task update lacks consistent team filtering.
4. **Why call `to_json` before emitting?** Socket payloads and REST responses should contain strings/datetime text rather than BSON objects.
5. **Why test an actual HTTP request instead of calling `update_task` directly?** A direct call bypasses FastAPI parsing, exception handlers, and dependency resolution.

[Next: MongoDB](05-async-mongodb.md)
