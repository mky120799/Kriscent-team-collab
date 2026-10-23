# Chapter 12 — Worked Feature: Filter Tasks by Status

This is a complete teaching example for a small backend feature. The code below is an exercise; it has not been applied to the app. Work through it in a branch after Chapters 3–8. The feature seems small, but it crosses the HTTP contract, Python typing, MongoDB query, authorization, tests, and frontend expectations.

## Requirement and acceptance criteria

On a project's Kanban board, users may request only tasks in one status column. `GET /api/tasks?projectId=<id>&status=done` should return tasks from that project with status `done`. Omitting `status` preserves the existing behavior and returns all tasks in the project. Unknown status values return the project's standard `400` error. A user must not use another team's project ID to read its tasks.

Write the contract before editing code:

| Input | Expected HTTP behavior |
| --- | --- |
| Valid project ID, no status | `200`, tasks for project |
| Valid project ID, `status=done` | `200`, only done tasks for project |
| Valid project ID, unknown status | `400`, `{"message": ...}` |
| Missing or malformed project ID | `400` |
| No token | `401` |
| Other team's project ID | Chosen `403` or `404`, no tasks leaked |

The last row is not implemented consistently in the current task list. Include it rather than pretending the filter alone makes the endpoint secure.

## Step 1: inspect the existing contract

Read [`get_tasks`](../../backend-python/app/routers/tasks.py). It receives `projectId: str | None`, converts it with `to_object_id`, queries `tasks` by `projectId`, calls `populate` for the assignee, then returns `to_json(tasks)`. Its router-level dependency requires authentication. The response is a list of task dictionaries with serialized IDs and timestamps. Do not change that response shape just to add filtering.

## Step 2: add typed query validation

[`TaskStatus`](../../backend-python/app/schemas/common.py) is `Literal["todo", "in-progress", "done"]`. Use it for the optional query parameter:

```python
from app.schemas.common import TaskStatus

@router.get("", dependencies=[Depends(get_current_user)])
async def get_tasks(
    db: Database,
    projectId: str | None = None,
    status: TaskStatus | None = None,
):
    ...
```

FastAPI reads simple parameters absent from the path as query parameters. An unknown status causes Pydantic/FastAPI validation to fail before the handler body. This project's exception handler maps that error to `400` and `{"message": ...}`. Test the exact response before documenting it as a guarantee.

## Step 3: build a combined MongoDB filter

After the existing `projectId` conversion:

```python
project_id = to_object_id(projectId)
if project_id is None:
    raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or missing projectId")

query = {"projectId": project_id}
if status is not None:
    query["status"] = status

tasks = await db[Collections.TASKS].find(query).to_list()
await populate(tasks, "assignedTo", db[Collections.USERS], ASSIGNEE_FIELDS)
return to_json(tasks)
```

Start with project scope and add status. A common bug is to replace the query with `{"status": status}`, leaking tasks from every project. Filtering in MongoDB avoids loading all project tasks and discarding most in Python.

## Step 4: enforce project/team scope

Before reading tasks, load the project by `_id` and decide whether this actor may see it. This requires receiving the authenticated user in the route, not only declaring it as a router dependency. For example:

```python
user: CurrentUser
```

Then compare the project's team to the actor's allowed team. The exact admin policy is a product decision: the current code often treats admins as broadly authorized, while managers and members should generally be restricted to their own team. The important property is that a guessed project ID must not bypass scope. Test the chosen `403` or `404` response and assert that no task data is returned.

Do not copy this as a one-line role check. A user's `role == "MEMBER"` says nothing about which team's project they may read.

## Step 5: write integration tests

Use the existing [`auth` and `register` fixtures](../../backend-python/tests/conftest.py). Set up a project with two tasks of different statuses and another project with a `done` task. Then assert both `projectId` and status are applied:

```python
response = await client.get(
    "/api/tasks",
    headers=auth("alice"),
    params={"projectId": project_id, "status": "done"},
)
assert response.status_code == 200
assert [task["_id"] for task in response.json()] == [done_task_id]
```

Add separate tests for no status, unknown status, missing project ID, no token, and other-team access. The result order is not currently guaranteed by an explicit sort; if multiple tasks match, compare sets of IDs or define and implement a stable sort first.

Run focused tests:

```bash
cd backend-python
TEST_MONGO_URI=mongodb://localhost:27017 pytest tests/test_api.py -k task -q -rs
```

If MongoDB is unavailable, the relevant tests skip. A skipped test does not verify the feature.

## Step 6: consider an index and pagination

For a small collection, the new filter may be fine without a new index. For many tasks, inspect queries and an explain plan. A compound index on `projectId` and `status` could help filtered reads; an index on `projectId` alone also supports unfiltered project reads. If the API later sorts by `createdAt`, index design should account for that. Avoid adding indexes without a query and data-size reason.

The current endpoint has no limit. Filtering does not solve unbounded responses. Write down a pagination contract before the board grows too large. Do not silently add a default limit that truncates existing boards without updating the frontend.

## Step 7: update the consumer and docs

The frontend task API service should accept an optional status and append it as a query parameter when present. Keep `projectId` required. Update the API documentation to show accepted status values and the authorization rule. No Socket.IO event is needed for a read-only filter. Existing task update events still tell a connected board when it should refresh or adjust its filtered view.

## Review checklist

- Can you explain why `TaskStatus | None` validates the query?
- Does the MongoDB query always retain `projectId`?
- Does a cross-team project ID expose tasks?
- Did tests run against MongoDB rather than skip?
- Is response order defined or treated as unspecified?
- Does the frontend still fetch all tasks when no status is selected?

[Back to course index](README.md)
