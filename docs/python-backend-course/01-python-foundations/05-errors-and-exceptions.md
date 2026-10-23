# 1.5 — Errors, Exceptions, Cleanup, and Logging

## Errors are part of the contract

An error can mean invalid input, missing data, lack of permission, a temporary dependency failure, or a programming bug. Handle each at the boundary where you have enough context.

```python
class TaskNotFoundError(Exception):
    pass


def require_task(task: dict | None) -> dict:
    if task is None:
        raise TaskNotFoundError("task does not exist")
    return task
```

Use custom exceptions for reusable domain behavior. Translate them into HTTP responses in the API layer.

## Catch narrowly

```python
try:
    task_id = int(raw_id)
except ValueError as exc:
    raise ValueError("task id must be numeric") from exc
```

Do not write `except Exception: pass`. It hides bugs and makes production failures impossible to diagnose. If a broad catch is necessary at an integration boundary, log it and return a safe fallback.

## Exception chaining

`raise ... from exc` preserves the original cause while exposing a clearer error to the caller:

```python
try:
    payload = response.json()
except ValueError as exc:
    raise ProviderResponseError("provider returned invalid JSON") from exc
```

## Cleanup with context managers

```python
with open("notes.txt", encoding="utf-8") as file:
    content = file.read()
```

The file closes even if reading raises. Async resources use `async with`, as `httpx.AsyncClient` does in the assistant service.

## Logging

```python
import logging

logger = logging.getLogger(__name__)


try:
    result = await provider_call()
except TimeoutError:
    logger.warning("provider timed out; using fallback")
    result = fallback()
```

Log the operation and safe identifiers, not tokens, private keys, or full sensitive payloads. Use `logger.exception` inside an exception handler when a traceback is valuable.

## HTTP boundary mapping

The domain layer should not need to know that the caller is using HTTP. A router can translate:

```python
try:
    task = await service.get_task(task_id)
except TaskNotFoundError as exc:
    raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
```

## Exercises

1. Define `InvalidStatusError` and use it in a pure status parser.
2. Add a fallback for a simulated provider timeout and assert that it logs a warning.
3. Find one broad exception handler in the project and explain why it exists.
4. Design an error table for a new endpoint.

## Repository connection

Read [`app/errors.py`](../../../backend-python/app/errors.py) and [`app/services/assistant.py`](../../../backend-python/app/services/assistant.py) together to see global HTTP translation versus local integration fallback.
