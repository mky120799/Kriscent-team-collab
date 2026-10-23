# 1.4 — Classes, Dataclasses, and Python’s Data Model

## When objects help

Use a class when data and behavior belong together, when invariants need enforcement, or when an object represents a dependency with state. Do not create a class for every dictionary automatically.

```python
class TaskTitle:
    def __init__(self, value: str):
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("title cannot be empty")
        self.value = cleaned

    def __str__(self) -> str:
        return self.value
```

The constructor establishes the invariant that a `TaskTitle` is never empty.

## Dataclasses

```python
from dataclasses import dataclass, field


@dataclass(slots=True)
class TaskSummary:
    title: str
    status: str = "todo"
    tags: list[str] = field(default_factory=list)
```

`default_factory` is essential for mutable fields. `slots=True` can reduce accidental attributes and memory use for many small objects.

Use a dataclass for trusted internal values. Use Pydantic when data arrives from HTTP, configuration, or another untrusted boundary.

## Properties and invariants

```python
class Percentage:
    def __init__(self, value: int):
        self.value = value

    @property
    def value(self) -> int:
        return self._value

    @value.setter
    def value(self, value: int) -> None:
        if not 0 <= value <= 100:
            raise ValueError("percentage must be between 0 and 100")
        self._value = value
```

Properties let callers use attribute syntax while the class protects its invariant.

## Composition over inheritance

Prefer putting a repository or clock inside a service rather than inheriting from a large base class:

```python
class TaskService:
    def __init__(self, repository, clock):
        self.repository = repository
        self.clock = clock
```

This makes dependencies explicit and easier to replace in tests.

## Protocols for behavior

```python
from typing import Protocol


class TaskRepository(Protocol):
    async def get(self, task_id: str) -> dict | None: ...

    async def save(self, task: dict) -> None: ...
```

Any object with these methods satisfies the protocol for type-checking purposes; inheritance is not required.

## Useful dunder methods

- `__repr__`: useful developer representation;
- `__str__`: user-facing string conversion;
- `__eq__`: value comparison;
- `__lt__`: ordering;
- `__iter__`: iteration;
- `__enter__` and `__exit__`: synchronous context managers;
- `__aenter__` and `__aexit__`: asynchronous context managers.

Implement these only when the behavior is natural and unsurprising.

## Exercises

1. Create a `TaskTitle` value object that trims whitespace and rejects empty values.
2. Convert a dictionary-based internal task summary into a dataclass.
3. Define a repository protocol and create an in-memory implementation for tests.
4. Explain why a service depending on a protocol is easier to test than one that constructs MongoDB internally.
