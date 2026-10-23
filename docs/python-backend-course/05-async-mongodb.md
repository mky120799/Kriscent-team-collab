# Chapter 5 — Async Persistence with MongoDB

## Goal

Persist and query data without blocking the event loop.

## The task write as a database lesson

For `POST /api/tasks`, the router does not send the client’s strings directly to MongoDB. It performs a sequence of boundary conversions:

```text
"projectId": "665f..."
        │
        ├─ to_object_id(...) ──> ObjectId("665f...")
        │
        ├─ new_document(...) ──> ObjectId references + UTC timestamps
        │
        ├─ insert_one(task) ──> persisted BSON document
        │
        └─ to_json(task) ──> JSON strings returned to React
```

Read this sequence in [`create_task`](../../backend-python/app/routers/tasks.py), [`new_document`](../../backend-python/app/database.py), and [`to_json`](../../backend-python/app/serialization.py). The [task lifecycle test](../../backend-python/tests/test_api.py) proves that the response contains string IDs and that the team event is emitted only after the insert.

## Concepts

- documents, collections, ObjectIds, and projections;
- indexes and uniqueness constraints;
- async cursors and `await` at I/O boundaries;
- timestamps and serialization of BSON values;
- database helpers that hide repetitive details;
- transactions and atomic updates when a feature needs them.

[`app/database.py`](../../backend-python/app/database.py) owns the connection, indexes, ObjectId conversion, timestamps, and a small `populate` helper. Routers use `find`, `insert_one`, `find_one_and_update`, and `find_one_and_delete` for feature operations.

The module has two different responsibilities worth separating mentally:

- connection lifecycle: `connect`, `close`, and `get_db`;
- document mechanics: `new_document`, `utcnow`, `to_object_id`, and `populate`.

That separation makes a router easier to read: the router decides *what* the task operation means, while the database helpers handle repeated BSON and timestamp details.

## Document lifecycle

The project’s `new_document()` helper drops unset fields, adds UTC `createdAt` and `updatedAt` values, and keeps a Mongoose-compatible `__v` field. This preserves the response and data expectations shared with the Node backend.

## Safe identifier handling

Never pass an unvalidated string directly into an ObjectId query. Convert it first and return a client error when the value is present but malformed.

```python
task_oid = to_object_id(task_id)
if task_oid is None:
    raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid task id")
```

There are two different cases to test:

- a present but malformed ID should be a client error (`400` in the task list/create helpers);
- a valid-looking ID that matches no document should be `404`.

Do not silently turn both cases into an empty list. An empty list can be a valid query result, while a malformed identifier is a contract error.

## Query design: filter before reading

The task list endpoint builds a MongoDB query from the required `projectId`:

```python
project_id = to_object_id(projectId)
if project_id is None:
    raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or missing projectId")

tasks = await db[Collections.TASKS].find(
    {"projectId": project_id}
).to_list()
```

The full code then calls `populate` for `assignedTo` and serializes the result. The filter is performed in MongoDB, not in Python after loading every task. For a larger dataset, the next improvement would be an index on `projectId` (possibly combined with `status`) and pagination with an explicit sort.

## What a good persistence test proves

In [`test_task_lifecycle`](../../backend-python/tests/test_api.py), do not stop at `201`:

1. The response has the default `todo` status.
2. The returned `teamId` and `assignedTo` are JSON strings.
3. A member can list the task through the project filter.
4. The populated assignee contains only the public fields selected by `ASSIGNEE_FIELDS`.
5. The update event uses the serialized task and the team room.

Each assertion protects a different boundary: defaults, BSON serialization, query scope, projection, and side effects.

## Checkpoint

Add `status: str | None = None` to the task list query, validate it against `TaskStatus`, and combine it with `projectId` in the MongoDB filter. Add a test for a matching status, a non-matching status, and an invalid status. Then decide whether an index on `projectId, status` is justified and record the decision in the chapter notes.

## Type ledger: follow a task across boundaries

| Value | HTTP/Pydantic | MongoDB document | JSON response |
| --- | --- | --- | --- |
| Task ID | Absent during create | `ObjectId` assigned at insert | String `_id` |
| `projectId` | String from body/query | `ObjectId` | String |
| `assignedTo` | Optional string | `ObjectId` or absent | String for create; populated user object on list/update |
| `createdAt` | Not sent by client | Aware UTC `datetime` | ISO string ending in `Z` |
| `status` | Literal string | String | String |

The assignee row demonstrates that one field can have different response shapes by endpoint. A frontend type must model the actual endpoint contract. Read `create_task`, `get_tasks`, and `update_task` before assuming a single response type covers all three.

## Atomicity: one write versus a workflow

`find_one_and_update` is a single-document atomic operation. That protects the field update from another concurrent writer halfway through. A task creation flow also writes an activity log and emits a Socket.IO event. These are separate operations. If activity logging fails after task insertion, the task can exist without a log; if emit fails, the task can exist without a realtime notification. Decide whether each side effect is required or best effort. If all database writes must be all-or-nothing, consider a MongoDB transaction with the required deployment configuration. If events must survive process failure, an outbox pattern is more appropriate than a plain emit.

## Index reasoning

An index on `users.firebaseUid` supports authentication lookup and the unique constraint prevents duplicate accounts under concurrent inserts. An index on `tasks.projectId` may support the list route; a compound `(projectId, status, createdAt)` index may help a filtered, sorted query, depending on the actual workload. Indexes require memory/storage and slow writes. Before adding one, identify a real query shape, data size, expected sort, and inspect an explain plan. Do not add an index solely because a field exists.

## Time handling

`utcnow()` returns `datetime.now(UTC)`. MongoDB stores UTC datetimes, and `to_json` formats them in UTC to millisecond precision. A naive datetime is treated as UTC by the serializer; do not rely on that to reinterpret local time. Validate and normalize incoming dates before storage. If a due date means a calendar day in a user's timezone rather than an instant, model that separately.

## Lab: a status filter with proof

1. Add a query parameter `status: TaskStatus | None` to `get_tasks`.
2. Start the filter as `{"projectId": project_id}`; add `filter["status"] = status` only when a status is supplied.
3. Create two tasks in the same project with different statuses and one task in another project.
4. Assert the filtered list returns only the matching task. This catches a bug where the status filter accidentally replaces the project filter.
5. Send an unknown status and assert the project's validation response. Inspect the message produced by `errors.py`.
6. Decide whether ordering and pagination should be part of this feature; document the decision.

[Next: Authentication](06-auth-and-security.md) · [PyMongo deep dive](technology-deep-dives/03-pymongo-bson.md)
