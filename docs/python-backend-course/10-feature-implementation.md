# Chapter 10 — How to Implement Features

## Goal

Ship complete features as vertical slices instead of isolated files.

A slice is complete only when user behavior, persistence, permissions, realtime behavior, tests, consumers, and documentation agree.

## Feature workflow

1. **Write behavior first.** Describe actor, action, resource, success response, and failure cases.
2. **Define the contract.** Choose route, method, parameters, body, response shape, and status codes.
3. **Model input.** Add or update a Pydantic schema and normalize values at the boundary.
4. **Check identity and permission.** Use `get_current_user`, `require_roles`, and explicit team/project checks.
5. **Implement persistence.** Add fields, queries, indexes, timestamps, and ObjectId conversion.
6. **Keep rules readable.** Extract a service when a route coordinates multiple rules or external calls.
7. **Publish side effects after success.** Log activity and emit events only after the database mutation succeeds.
8. **Test the contract.** Cover success, invalid input, not found, unauthorized, forbidden, scope, and event payloads.
9. **Update consumers.** Keep React API services, TypeScript types, and UI behavior aligned.
10. **Document the feature.** Record endpoints, environment needs, migrations, and rollout notes.

## Example: add task due dates

Product request: “Managers can set a due date; members can see it and update task status, but cannot change the due date.”

### Contract

- `POST /api/tasks` accepts optional `dueAt` as an ISO-8601 datetime.
- `PUT /api/tasks/{id}` lets managers change `dueAt`.
- Members may update `status` only.
- Responses include `dueAt` as an ISO-8601 string or `null`.
- Invalid dates return the chosen validation error contract.

### Implementation checklist

1. Add `dueAt: datetime | None` to `TaskCreate` and `TaskUpdate`.
2. Separate the manager-only due-date update from member status updates.
3. Store an aware UTC datetime in MongoDB.
4. Serialize it through the existing `to_json` path.
5. Include it in `task-created` and `task-updated` event payloads.
6. Update the frontend task type, form, and card.
7. Test manager create, manager update, member status update, member due-date rejection, and event payloads.

```python
from datetime import datetime


class TaskCreate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: TaskStatus = "todo"
    projectId: str | None = None
    assignedTo: str | None = None
    teamId: str | None = None
    dueAt: datetime | None = None
```

The lesson: a feature is not “a new field in a model.” It is a coordinated change across the public contract, authorization, storage, realtime events, tests, and consumers.

### Work through the change by file

`app/schemas/task.py` defines the public input. A `datetime | None` accepts an ISO timestamp but also loses the distinction between “omitted” and “clear the due date” unless you inspect `model_fields_set`. Choose and test the desired clearing behavior before implementing it. Require a timezone or normalize to UTC before persistence; storing local naive times makes overdue checks ambiguous.

`app/routers/tasks.py` currently permits members to call the whole update route. Add a field-level permission rule before building `changes`: members may submit `status`, while `dueAt` is manager/admin only. Check the actor's team against the task's team before the update. Prefer an update filter that includes allowed scope so a cross-team task cannot be modified between a separate read and write.

`app/database.py` already supplies UTC timestamps and `to_object_id`; no new collection is needed for a field on an existing task. Consider an index only after defining a query such as “due this week in project X.” `app/serialization.py` already converts datetimes to UTC ISO strings. Verify the optional/null response shape instead of assuming it.

The task router emits the serialized updated task. If `dueAt` is in that payload, frontend Socket.IO consumers can update the same field they receive from REST. Update `frontend/src/types/task.ts` and the task API/UI code to match the exact JSON field name. A mismatch such as `due_at` versus `dueAt` will be visible in the browser even if backend tests pass.

In `tests/test_api.py`, add a manager creation test, a manager due-date update test, a member status-only success test, a member due-date rejection, a cross-team rejection, and an assertion that the emitted event carries the serialized due date. These tests prove different requirements; a single `201` assertion does not.

## When to create a service module

Keep simple CRUD in the router while it remains easy to read. Extract a service when the operation calls multiple collections, has branching business rules, emits several events, calls an external provider, is reused by HTTP and Socket.IO, or is difficult to test without the web framework.

```python
async def create_task_for_project(*, db, actor, payload):
    # validate scope and business rules
    # build and persist the document
    # return the domain result
    ...
```

## Deep implementation workshop: due dates

The earlier checklist names the files. This workshop explains the choices inside each file. It is an implementation exercise, not code already present in the repository. A finished change must be reviewed against the current frontend contract and tested with MongoDB.

### 1. Define the data meaning first

`dueAt` is an **instant**, such as `2026-10-24T12:00:00Z`, rather than a date with no timezone. Store an aware UTC `datetime` in MongoDB. A client with a local date picker must convert the selected local time to an ISO timestamp with an offset or `Z`. If the product actually means “due on Friday in each user's locale,” model a calendar date and timezone separately. Choosing the type after adding the form leads to ambiguous overdue logic.

Define three update intents:

| JSON | Meaning |
| --- | --- |
| `{"status": "done"}` | Leave `dueAt` unchanged |
| `{"dueAt": "2026-10-24T12:00:00Z"}` | Set the due instant |
| `{"dueAt": null}` | Clear the due instant |

An omitted field and explicit `null` must not be treated as the same operation. Pydantic's `model_fields_set` distinguishes them.

### 2. Validate at the request boundary

Add the field to both task request models. For incoming timestamps, reject timezone-free values rather than guessing the user's timezone:

```python
from datetime import UTC, datetime
from pydantic import BaseModel, field_validator

class TaskUpdate(BaseModel):
    status: TaskStatus | None = None
    assignedTo: str | None = None
    dueAt: datetime | None = None

    @field_validator("dueAt")
    @classmethod
    def require_aware_due_at(cls, value: datetime | None) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("dueAt must include a timezone")
        return value.astimezone(UTC)
```

Use the same validator for `TaskCreate`, preferably by extracting a reusable annotated type or validator helper rather than copying logic. This validator establishes time representation only. It does not decide whether a member may change the date.

The current exception handler maps Pydantic validation errors to `400`. A test should assert the response body for a naive timestamp such as `"2026-10-24T12:00:00"` and for an invalid string such as `"tomorrow"`.

### 3. Authorize the field and the resource

The current update route allows ADMIN, MANAGER, and MEMBER and builds `changes` from `status` and `assignedTo`. Before adding `dueAt` to `changes`, check whether it was supplied:

```python
if "dueAt" in payload.model_fields_set and user["role"] == "MEMBER":
    raise HTTPException(status.HTTP_403_FORBIDDEN, "Only managers can change due dates")

if "dueAt" in payload.model_fields_set:
    changes["dueAt"] = payload.dueAt
```

If your policy also forbids members from changing assignees, add a separate field-level rule. Do not assume the new due-date rule repairs existing `assignedTo` permissions.

Next, constrain the update to a task the actor may access. One option for a manager or member is an atomic filter:

```python
query = {"_id": task_oid, "teamId": user["teamId"]}
task = await db[Collections.TASKS].find_one_and_update(
    query,
    {"$set": changes},
    return_document=ReturnDocument.AFTER,
)
```

Define the admin policy separately: if admins can access all teams, omit the team clause for them; if admins are scoped too, keep it. This is a product decision. If `user["teamId"]` is absent, do not broaden the query to `_id` alone. A missing match should produce the chosen `403`/`404` contract without revealing another team's document.

Creation also needs scope validation. The current `create_task` route can take `teamId` from the client. Before writing a due date or any other task field, verify that the actor may create in that team and that `projectId` belongs to it. Otherwise a manager could create a task attached to another team's project.

### 4. Persist, serialize, and emit

On create, pass `dueAt=payload.dueAt` into `new_document`. The helper drops `None` values, so a task without a due date has no `dueAt` field in MongoDB. On update, `$set: {"dueAt": None}` can represent clearing the field, or `$unset` can remove it. Choose one storage convention and test it. A mixture of absent and null values complicates queries.

The stated HTTP contract says responses include `dueAt` as an ISO string or `null`. `to_json` already converts a `datetime` to a UTC string, but it does **not** create missing keys. If storage omits `dueAt`, explicitly normalize the response:

```python
data = to_json(task)
data.setdefault("dueAt", None)
```

Apply the same normalization to create, list, and update responses if all endpoints promise the field. For list results, normalize each task. Ensure the Socket.IO event uses the same normalized `data`, so a live update and a GET return the same shape. A separate response model is another way to enforce this consistently.

The task route currently writes, logs activity, emits to a room, then returns. An emit failure after the database write can surface as an HTTP error even though the due date changed. Decide whether the event is best effort or whether you need durable delivery. Do not solve that by emitting before the write.

### 5. Update the frontend without type drift

The frontend has task types in more than one place, including [`task.api.ts`](../../frontend/src/store/services/task.api.ts) and [`types/task.ts`](../../frontend/src/types/task.ts). Search all `Task` declarations and components before editing. Add `dueAt?: string | null` or a stricter normalized type matching the chosen API contract. A datetime becomes a string over JSON; TypeScript `Date` is not what the network sends.

The task RTK Query listener currently handles `task-updated`. It replaces an existing cached task or appends a new one for the same project. That means the emitted task shape must include the due date. Existing create/delete mutations invalidate tags for the initiating client; remote clients may need additional event listeners or refetch behavior for create/delete. Do not assume that emitting an event guarantees the current frontend subscribes to it.

### 6. Test the complete behavior

Build tests for distinct boundaries:

1. **Parsing:** an aware timestamp is accepted and normalized to UTC; a naive timestamp is rejected.
2. **Creation:** a manager creates a task with `dueAt`; response and stored document represent the same instant.
3. **Clear:** a manager sends `{"dueAt": null}`; response shows `null` and a later GET agrees.
4. **Omission:** a status-only update leaves the existing due date unchanged.
5. **Role:** a member attempting to set or clear the due date gets `403`, with no database change or event.
6. **Scope:** an actor from team A cannot modify a task in team B, even with a known ID.
7. **Realtime:** `task-updated` carries the same normalized `dueAt` as the HTTP response and targets the correct room.
8. **Compatibility:** tasks created before the feature return `dueAt: null` if that is the new response contract.

Run the focused API tests against a reachable MongoDB instance. If the fixture skips, these cases have not been verified. Finally inspect `/docs` to confirm the request schema and manually exercise a manager and member flow.

### 7. Review the tradeoffs

The feature has three separate correctness questions: Did we store the right instant? Was this actor allowed to change this task and field? Did every consumer see a consistent value? A passing schema test answers only the first part of the first question. The contract, permission, persistence, event, frontend, and test changes are all required for the feature to be complete.

[Next: Labs](11-labs-and-capstone.md) · [Worked status-filter feature](12-worked-feature-task-filter.md)
