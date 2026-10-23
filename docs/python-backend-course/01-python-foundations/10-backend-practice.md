# 1.10 — Backend Practice Project

## Goal

Combine the Python foundations into a small framework-free service core before using FastAPI.

## Build a task service core

Create a package with:

```text
practice_task_core/
  __init__.py
  models.py
  parser.py
  service.py
  errors.py
tests/
  test_parser.py
  test_service.py
```

### `models.py`

Create a dataclass or Pydantic model for a task with `id`, `title`, and a `Literal` status.

### `parser.py`

Implement pure functions:

- `normalize_title(value)`: trim and reject blank titles;
- `normalize_status(value)`: support aliases such as `doing` and `finished`;
- `parse_command(text)`: parse “create task X” and “move task X to done”.

### `service.py`

Implement an in-memory service with:

- `create_task(title)`;
- `get_task(task_id)`;
- `move_task(task_id, status)`;
- `list_tasks(status=None)`.

Keep storage behind a small repository protocol so the service does not know whether data is in a dictionary, MongoDB, or another database.

### `errors.py`

Define `TaskNotFoundError`, `InvalidTitleError`, and `InvalidStatusError`. Tests should assert these domain errors directly; an HTTP adapter can translate them later.

## Acceptance criteria

- Blank titles are rejected.
- Status aliases normalize consistently.
- Missing task ids raise `TaskNotFoundError`.
- `list_tasks` does not mutate stored tasks.
- The service has no FastAPI or MongoDB imports.
- Every public operation has success and failure tests.

## Stretch exercises

1. Add due dates using aware UTC datetimes.
2. Add a repository fake and inject it into the service.
3. Add an async repository interface without making pure parsing functions async.
4. Add a FastAPI adapter in a separate module after the core is complete.
5. Compare your adapter with [`app/routers/tasks.py`](../../../backend-python/app/routers/tasks.py).

## Bridge to FastAPI

Once the core is correct, the web layer should mainly do four things:

1. parse HTTP input;
2. authenticate and authorize the actor;
3. call the service;
4. translate the result or domain error into an HTTP response.

That separation is the foundation for the later chapters on FastAPI, MongoDB, authentication, and feature implementation.
