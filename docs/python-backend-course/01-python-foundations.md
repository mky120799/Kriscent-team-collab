# Chapter 1 — Python Foundations for Backend Work

This file is the project-connected introduction. The complete foundation curriculum is now organized separately in the [Python Foundations section](01-python-foundations/README.md), with dedicated topic chapters and exercises.

## Goal

Write clear, typed Python without relying on framework magic.

## The real case: moving a task

When Bob sends:

```http
PUT /api/tasks/665f... HTTP/1.1
Authorization: Bearer <Firebase ID token>
Content-Type: application/json

{"status": "in-progress"}
```

the useful Python work is not “FastAPI magic.” It is ordinary data handling:

1. `TaskUpdate` validates the JSON and restricts `status` to the project’s allowed values.
2. `get_current_user` turns the bearer token into a local user dictionary.
3. `update_task` builds a `changes` dictionary and adds a UTC timestamp.
4. MongoDB performs the update asynchronously.
5. `to_json` converts the returned `ObjectId` and datetime into JSON values.
6. Socket.IO broadcasts the serialized task to the team room.

Start with [`test_task_lifecycle`](../../backend-python/tests/test_api.py), then open [`TaskUpdate`](../../backend-python/app/schemas/task.py) and [`update_task`](../../backend-python/app/routers/tasks.py). That is the code path this chapter is teaching.

## Concepts to practise

- values, collections, functions, comprehensions, and modules;
- exceptions and error boundaries;
- type hints, `dict[str, Any]`, `TypedDict`, `Protocol`, and `Annotated`;
- `datetime`, regular expressions, JSON, and environment variables;
- context managers and `async`/`await`;
- iterators, generators, and async iterators;
- small pure functions that are easy to test.

## Type boundaries: validate at the edge, keep internals simple

```python
from typing import Any


def get_display_name(user: dict[str, Any]) -> str:
    name = user.get("name")
    email = user.get("email")
    return str(name or email or "Unknown user")
```

At external boundaries, use Pydantic models. Inside a small function, a plain dictionary may be enough. Make contracts visible where data changes hands.

The task router follows this idea: the request body is a Pydantic `TaskUpdate`, while the MongoDB update is a small internal `dict` containing only changed fields. Do not pass the request model directly into MongoDB; the database document has different names, types, and invariants.

## Keep pure logic separate from I/O

```python
def normalize_status(value: str | None) -> str:
    aliases = {
        "to do": "todo",
        "doing": "in-progress",
        "finished": "done",
    }
    normalized = (value or "todo").strip().lower()
    return aliases.get(normalized, normalized)
```

A pure function can be reused by HTTP, Socket.IO, or an AI fallback parser and tested without a database.

The repository has a concrete example in [`fallback_parse`](../../backend-python/app/services/assistant.py). It converts text such as `Move task Login to done` into a small command dictionary. Its tests do not need FastAPI, Firebase, MongoDB, or a running server: see [`test_assistant_parser.py`](../../backend-python/tests/test_assistant_parser.py). This is the boundary between domain logic and I/O.

## Await I/O; do not hide it

```python
async def load_project(db, project_id):
    return await db["projects"].find_one({"_id": project_id})
```

Use `async def` when the function awaits network, database, or file I/O. Do not add `async` to CPU-only code just because the application is asynchronous.

In [`tasks.py`](../../backend-python/app/routers/tasks.py), `find_one_and_update`, `insert_one`, `populate`, `log_activity`, and `sio.emit` are all awaited. The request can yield while MongoDB or Socket.IO is working, allowing the event loop to serve other requests. `to_json` is synchronous because it only transforms values already in memory.

## Raise at the right boundary

```python
from fastapi import HTTPException, status


def require_title(title: str | None) -> str:
    cleaned = (title or "").strip()
    if not cleaned:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Title is required")
    return cleaned
```

For reusable domain code, prefer a domain exception and translate it to HTTP in the router or exception handler. For small endpoint-specific validation, `HTTPException` matches the current project style.

You can see both layers in this project. `fallback_parse` returns a domain result and never raises an HTTP error. The task router raises `HTTPException` for a missing title, malformed ID, or missing project because those are HTTP contract decisions. The global error translation lives in [`app/errors.py`](../../backend-python/app/errors.py).

## A practical tracing exercise

Follow the create path for Alice:

```python
response = await client.post(
    "/api/tasks",
    headers=auth("alice"),
    json={"title": "Build login", "projectId": project_id, "assignedTo": bob_id},
)
```

Find where each value changes form:

| Value | Boundary | Code |
| --- | --- | --- |
| `projectId` string | JSON → `ObjectId` | `_parse_id` in [`tasks.py`](../../backend-python/app/routers/tasks.py) |
| task fields | input → document | `new_document` in [`database.py`](../../backend-python/app/database.py) |
| `_id` and timestamps | BSON → JSON | `to_json` in [`serialization.py`](../../backend-python/app/serialization.py) |
| task document | successful write → event | `sio.emit("task-created", ...)` |

If you cannot point to the code for a conversion, the concept is not understood yet.

## Checkpoint

Add one pure case to [`fallback_parse`](../../backend-python/app/services/assistant.py), for example `Create task Write tests in progress`, and test it in [`test_assistant_parser.py`](../../backend-python/tests/test_assistant_parser.py). Then add a failing-input case and explain why this function does not import FastAPI, MongoDB, or Firebase.
