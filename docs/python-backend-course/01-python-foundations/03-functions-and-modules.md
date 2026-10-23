# 1.3 — Functions, Scope, Decorators, and Modules

## Functions are values

```python
def normalize_name(value: str) -> str:
    return " ".join(value.split()).title()


formatter = normalize_name
assert formatter("  alice   smith ") == "Alice Smith"
```

Functions can be passed, stored, and returned. This powers callbacks, dependency factories, and test helpers.

## Clear signatures

```python
def create_filter(*, status: str | None = None, team_id: str | None = None) -> dict:
    query = {}
    if status is not None:
        query["status"] = status
    if team_id is not None:
        query["teamId"] = team_id
    return query
```

The `*` makes optional parameters keyword-only. Use `*args` and `**kwargs` only when adapting a genuinely variable interface.

## Default arguments

Never use mutable defaults:

```python
def safe_add_item(item, items=None):
    items = [] if items is None else items
    items.append(item)
    return items
```

Default expressions are evaluated once when the function is defined.

## Scope and closures

```python
def minimum_length(size: int):
    def check(value: str) -> bool:
        return len(value) >= size

    return check


is_long = minimum_length(8)
assert is_long("FastAPI!")
```

Avoid `global` in application code. Pass state explicitly or encapsulate it in an object.

## Generators

```python
def non_empty(lines):
    for line in lines:
        cleaned = line.strip()
        if cleaned:
            yield cleaned
```

Generators produce values lazily, which is useful for large files and streams.

## Decorators

```python
from functools import wraps


def announce(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        print(f"calling {function.__name__}")
        return function(*args, **kwargs)

    return wrapper
```

FastAPI dependencies are not ordinary decorators, but both patterns compose reusable behavior around a handler.

## Modules and packages

A module is a `.py` file; a package is an importable directory. Keep modules focused, let higher-level modules depend on lower-level modules, and avoid circular imports by moving shared types into stable modules.

Use `if __name__ == "__main__":` for code intended to run directly while keeping imports safe.

## Exercises

1. Write a function that applies a callable to every task title.
2. Rewrite a function with too many positional arguments as keyword-only.
3. Build a generator that yields tasks from newline-delimited JSON.
4. Split a notes app into `models.py`, `repository.py`, and `main.py` without circular imports.

## Repository connection

Map the package structure under [`backend-python/app/`](../../../backend-python/app/) and classify configuration, infrastructure, HTTP adapters, services, and schemas.
