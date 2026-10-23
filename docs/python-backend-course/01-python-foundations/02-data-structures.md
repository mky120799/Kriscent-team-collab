# 1.2 — Data Structures and Collection Design

## Choosing the structure

| Structure | Best for | Typical lookup |
| --- | --- | --- |
| `list` | Ordered, repeatable items | O(n) by value |
| `tuple` | Fixed ordered records | O(n) by value |
| `dict` | Key-to-value mapping | O(1) average by key |
| `set` | Unique membership | O(1) average membership |
| `deque` | Queue operations at both ends | O(1) at ends |

Big-O describes how work grows. It helps you avoid scanning every user repeatedly when a dictionary would solve the lookup.

## Lists and copying

```python
tasks = ["design", "build"]
tasks.append("test")
first = tasks[0]
last = tasks[-1]
subset = tasks[1:]
```

Slicing and `.copy()` create a shallow copy. Nested objects are still shared:

```python
original = [{"status": "todo"}]
shallow = original.copy()
shallow[0]["status"] = "done"
assert original[0]["status"] == "done"
```

Use `copy.deepcopy` only when you truly need recursive copying; redesigning shared state is often safer.

## Dictionaries and sets

```python
task = {"title": "Build API", "status": "todo"}
task["status"] = "in-progress"
owner = task.get("assignedTo")
status = task.get("status", "todo")

tasks_by_id = {task["_id"]: task for task in tasks}
task = tasks_by_id.get(task_id)

requested_roles = {"ADMIN", "MANAGER", "ADMIN"}
if user_role in requested_roles:
    ...
```

Use `.get()` when a missing key is expected. Use `mapping["required"]` when missing data should fail loudly.

## Mutation and function arguments

```python
def with_tag(tags: list[str], tag: str) -> list[str]:
    return [*tags, tag]
```

Returning a new list makes the non-mutating behavior obvious. Mutate in place only when the contract says the caller’s object changes.

## Nested external data

```python
email = response.get("user", {}).get("email")
```

This is acceptable at a small boundary. For repeated nested data, validate it into a Pydantic model instead of spreading `.get()` chains across the application.

## Exercises

1. Group tasks by `teamId` into a dictionary of lists.
2. Find duplicate emails using a set.
3. Explain why `matrix = [[0] * 3] * 3` is dangerous and build it correctly.
4. Compare membership in a list and a set with a large collection.

## Repository connection

Study [`app/database.py`](../../../backend-python/app/database.py) for dictionaries as documents, sets for unique ObjectIds, and projections for controlled data loading.

## Worked lesson: why `populate` uses a set and a dictionary

Open `populate()` in `app/database.py`. Imagine three tasks assigned to two users:

```python
tasks = [
    {"title": "API", "assignedTo": alice_id},
    {"title": "UI", "assignedTo": alice_id},
    {"title": "Tests", "assignedTo": bob_id},
]
```

The helper first builds a **set** of IDs. This removes the duplicate `alice_id` before querying MongoDB. It then uses `$in` to load both users in one database query, and creates a **dictionary** indexed by `_id`. Finally, it loops through the original **list** and replaces each `assignedTo` ID with the matching projected user. For `n` tasks and `u` returned users, the Python-side work is approximately O(n + u). Querying MongoDB once per task would require `n` round trips.

The replacement mutates the input dictionaries. After `await populate(tasks, ...)`, `tasks[0]["assignedTo"]` is no longer an `ObjectId`; it is a user dictionary or `None`. That matters if the same task dictionary is reused later. Predict that change before reading the function body.

## Identity, equality, and copying

```python
task = {"status": "todo"}
alias = task
copy = task.copy()
assert alias is task
assert copy is not task
assert copy == task
alias["status"] = "done"
assert task["status"] == "done"
assert copy["status"] == "todo"
```

`copy()` duplicates only the outer dictionary. Nested values stay shared:

```python
original = {"tags": ["backend"]}
copied = original.copy()
copied["tags"].append("urgent")
assert original["tags"] == ["backend", "urgent"]
```

The same issue explains why `[[0] * 3] * 3` creates three references to one inner list. Build independent rows with `[[0] * 3 for _ in range(3)]`.

## Choosing access and search behavior

`task["title"]` raises `KeyError` when a required field is missing. `task.get("assignedTo")` returns `None` for an optional field. Using `.get()` everywhere can hide malformed data. A list scan such as `next((task for task in tasks if task["_id"] == target), None)` is fine once; repeated lookups justify `{task["_id"]: task for task in tasks}`. Building the index takes O(n) time and extra memory, while later dictionary lookups are O(1) on average.

## Queue versus collection

`list.append()` is efficient, but `list.pop(0)` shifts all remaining elements. For an in-memory queue use `collections.deque` and `popleft()`. A `deque` is not a durable job queue: process restart loses its contents. For task delivery in production, choose durable storage and acknowledge/retry semantics.

## Extended exercise and answer check

Write `group_by_team(tasks)` for this input:

```python
tasks = [
    {"teamId": "a", "title": "API"},
    {"teamId": "b", "title": "UI"},
    {"teamId": "a", "title": "Tests"},
]
```

Expected result: the `"a"` key has two tasks in input order, and `"b"` has one. One solution is:

```python
def group_by_team(tasks: list[dict]) -> dict[str, list[dict]]:
    grouped: dict[str, list[dict]] = {}
    for task in tasks:
        grouped.setdefault(task["teamId"], []).append(task)
    return grouped
```

The grouped lists hold references to the original task dictionaries. If you mutate a grouped task, the corresponding item in `tasks` changes too. If that is undesirable, define a copying policy explicitly.
