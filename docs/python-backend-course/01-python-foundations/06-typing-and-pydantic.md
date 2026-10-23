# 1.6 — Type Hints, Pydantic, and Data Contracts

## Type hints document intent

```python
from typing import Any


def get_display_name(user: dict[str, Any]) -> str:
    return str(user.get("name") or user.get("email") or "Unknown user")
```

Annotations do not usually validate values at runtime. They help readers and tools. Runtime validation belongs at the boundary.

## Common modern annotations

```python
from collections.abc import Sequence
from typing import Literal, TypeAlias

TaskStatus: TypeAlias = Literal["todo", "in-progress", "done"]


def titles(tasks: Sequence[dict[str, str]]) -> list[str]:
    return [task["title"] for task in tasks]
```

Use `X | None` for an optional value. Use `Sequence` when a function only needs iteration and indexing, not list-specific mutation.

## TypedDict versus dataclass versus Pydantic

- `TypedDict`: a dictionary shape for static checking;
- dataclass: a trusted in-process value with behavior or defaults;
- Pydantic model: runtime parsing and validation at an external boundary.

```python
from typing import TypedDict


class UserSummary(TypedDict):
    _id: str
    name: str
    email: str
```

## Pydantic validation

```python
from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    status: TaskStatus = "todo"
```

Pydantic parses JSON-compatible input and rejects invalid values before the route body runs. Keep validation rules close to the request model; keep authorization and database rules in the service or route layer.

## Serialization and normalization

```python
from datetime import datetime


class TaskRead(BaseModel):
    title: str
    due_at: datetime | None = None
```

Use aware UTC datetimes for backend data. Decide whether the public API uses `dueAt` or `due_at`, then keep that contract consistent across frontend, backend, and events.

## Avoid `Any` spreading

`Any` is useful at a raw integration boundary, but it turns off type checking wherever it flows. Parse external data into a model or a narrower structure as soon as possible.

## Exercises

1. Add a Pydantic model for a notification with a non-empty message and a finite severity literal.
2. Convert an untyped helper to use `Sequence`, `Mapping`, and `Literal`.
3. Decide whether three project values should be a `TypedDict`, dataclass, or Pydantic model and explain why.
4. Test a model with missing, extra, and invalid fields.

## Repository connection

Compare the request models in [`app/schemas/`](../../../backend-python/app/schemas/) with the internal dictionaries built in [`app/routers/tasks.py`](../../../backend-python/app/routers/tasks.py).

## Worked boundary: optional does not always mean omittable

In Pydantic v2, `field: str | None` allows `None` but is still required unless it has a default. `field: str | None = None` allows omission. The project uses the latter for `TaskUpdate.assignedTo`:

```python
from pydantic import BaseModel

class Update(BaseModel):
    assignedTo: str | None = None

omitted = Update.model_validate({})
cleared = Update.model_validate({"assignedTo": None})
assert omitted.assignedTo is None
assert cleared.assignedTo is None
assert "assignedTo" not in omitted.model_fields_set
assert "assignedTo" in cleared.model_fields_set
```

The two objects have the same attribute value but different intent. The current task router checks `if payload.assignedTo is not None`, so explicit `null` does not clear the assignee. If clearing is a product requirement, use `model_fields_set` to distinguish "sent null" from "not sent", then update persistence and tests accordingly.

## Type hints versus runtime truth

`User = dict[str, Any]` in `app/dependencies.py` communicates a broad shape but does not enforce keys or values. `Any` means a type checker cannot catch `user["rol"]` as a typo. A `TypedDict` can describe the local user document more precisely, while a Pydantic model can validate untrusted provider data. Choose based on boundary: static help for trusted internal records, runtime checking for input received across a network.

## Validation is not authorization

A schema can validate that `teamId` looks like a string or ObjectId. It cannot prove that the authenticated manager belongs to that team. The router or service must compare the actor to the target resource. The [Firebase and RBAC lesson](../technology-deep-dives/04-firebase-auth.md) traces this gap in the current code.
