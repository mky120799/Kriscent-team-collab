# 1.1 — Syntax, Names, Objects, and Control Flow

## Names and values

Assignment binds a name to an object:

```python
count = 3
other_count = count
count = 4

assert other_count == 3
```

For mutable objects, two names can point to the same object:

```python
items = []
same_items = items
items.append("task")

assert same_items == ["task"]
assert items is same_items       # identity: same object
assert items == same_items       # equality: same contents
```

Use `is` for identity checks, especially `value is None`. Use `==` for value comparison.

## Types and truthiness

```python
name: str = "Alice"
count: int = 3
ratio: float = 0.75
enabled: bool = True
missing: None = None
```

False-like values include `None`, `False`, zero, empty strings, empty lists, empty dictionaries, and empty sets. Be careful: `0` and `""` may be valid values in some domains. Use `is None` when “missing” differs from “empty”.

## Conditions and guard clauses

```python
def can_edit_task(user: dict, task: dict) -> bool:
    if user.get("role") == "ADMIN":
        return True
    if user.get("teamId") != task.get("teamId"):
        return False
    return user.get("role") == "MANAGER"
```

Guard clauses reduce nesting and make authorization decisions easier to audit.

## Loops and comprehensions

```python
for index, task in enumerate(tasks, start=1):
    print(index, task["title"])

completed_titles = [
    task["title"]
    for task in tasks
    if task["status"] == "done"
]

email_by_id = {user["_id"]: user["email"] for user in users}
unique_roles = {user["role"] for user in users}
```

Use a normal loop when a comprehension needs multiple steps, logging, or error handling.

## Structural pattern matching

```python
def describe_event(event: dict) -> str:
    match event:
        case {"type": "task-created", "taskId": task_id}:
            return f"created {task_id}"
        case {"type": "task-deleted", "taskId": task_id}:
            return f"deleted {task_id}"
        case _:
            return "unknown event"
```

Use `match` when the input has a small, known set of shapes, not as a replacement for every `if` statement.

## Exercises

1. Write `classify_status(value)` for `todo`, `in-progress`, and `done`, raising `ValueError` otherwise.
2. Count tasks by status.
3. Rewrite a deeply nested conditional using guard clauses.
4. Predict whether two names refer to the same list before running `append` and `= []` examples.

## Repository connection

Study the branching command parser and status aliases in [`app/services/assistant.py`](../../../backend-python/app/services/assistant.py).
