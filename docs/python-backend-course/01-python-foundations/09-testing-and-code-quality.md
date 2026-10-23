# 1.9 — Testing and Code Quality

## Why tests are design feedback

If a pure function is difficult to test, it may be doing too much. If an API test needs half the application to be real, the boundaries may be unclear. Tests show whether the code has understandable inputs, outputs, and side effects.

## A focused unit test

```python
def normalize_status(value: str | None) -> str:
    aliases = {"doing": "in-progress", "finished": "done"}
    return aliases.get((value or "todo").strip().lower(), value or "todo")


def test_normalize_status_aliases():
    assert normalize_status(" Doing ") == "in-progress"
    assert normalize_status("finished") == "done"
```

Arrange the input, act once, and assert the observable result. Do not test implementation details that do not matter to callers.

## Fixtures

Fixtures provide reusable setup and cleanup:

```python
import pytest


@pytest.fixture
def task():
    return {"_id": "1", "title": "Build API", "status": "todo"}
```

Keep fixtures small. A giant fixture hides what a test actually needs.

## Async tests

The project enables automatic async test handling in `pyproject.toml`:

```python
async def test_health(client):
    response = await client.get("/health")
    assert response.status_code == 200
```

Test async behavior with the same await boundaries as production. Do not replace every async function with a fake synchronous version; that can hide event-loop bugs.

## Mocks and fakes

Use a fake when a small deterministic implementation improves the test. Use `AsyncMock` when you need to assert an async side effect:

```python
from unittest.mock import AsyncMock


emit = AsyncMock()
await emit("task-created", task, room=team_id)
emit.assert_awaited_once()
```

Mock boundaries, not every internal function. Over-mocking makes tests pass while the real system is broken.

## Code quality checklist

- Names describe intent.
- Functions have one clear responsibility.
- Side effects are visible in the signature or body.
- Validation happens at boundaries.
- Errors are not swallowed.
- Tests cover behavior and failure paths.
- Imports are stable and modules do not depend circularly.
- Formatting and linting are automated.

## Exercises

1. Add unit tests for the assistant fallback parser.
2. Add a failing-input test and assert the error type or response status.
3. Replace a fragile mock with a small fake repository.
4. Refactor one function longer than thirty lines and preserve its tests.

## Repository connection

Start with [`tests/test_assistant_parser.py`](../../../backend-python/tests/test_assistant_parser.py), then study the database setup and mocks in [`tests/conftest.py`](../../../backend-python/tests/conftest.py).
