# Async PyMongo, MongoDB, and BSON

## Connection and lifetime

[`database.connect`](../../../backend-python/app/database.py) creates an `AsyncMongoClient`, pings the server, chooses a database, then ensures user indexes. `get_db()` returns the connected database or fails if startup did not finish. `close()` releases the client on shutdown. A route receives the database through FastAPI's `Database` dependency.

MongoDB documents use BSON. `_id` is commonly an `ObjectId`; timestamps are Python `datetime` objects. Neither should be handed directly to a browser. [`to_json`](../../../backend-python/app/serialization.py) recursively converts IDs to strings and datetimes to UTC ISO strings with `Z`.

## Query and update mechanics

The task list builds a filter such as `{"projectId": project_oid}` and awaits `find(...).to_list()`. This makes MongoDB filter before Python loads results. `find_one_and_update` with `{"$set": changes}` and `ReturnDocument.AFTER` returns the updated task. `find_one_and_delete` returns the deleted document, which lets the route identify the team room for its deletion event.

```python
task = await db[Collections.TASKS].find_one_and_update(
    {"_id": task_oid},
    {"$set": {"status": "done", "updatedAt": utcnow()}},
    return_document=ReturnDocument.AFTER,
)
```

`$set` updates only named fields. Replacing the whole document can accidentally remove fields. A single document update is atomic; an activity log insert plus task insert is not automatically a transaction. If both must succeed or fail together, design a transaction or an outbox approach explicitly.

## Indexes and scale

The current setup creates unique indexes on `users.firebaseUid` and `users.email`. That protects uniqueness under concurrent requests; an application level “find then insert” check alone cannot. Task list filtering by `projectId` may benefit from an index when data grows. Confirm with query patterns and `explain` rather than creating every possible index; indexes speed reads but cost storage and writes.

The current task list has no pagination. A large project could return too many documents. A production list endpoint should define an explicit sort, limit, and a pagination strategy, then test stable ordering.

## `populate` versus joins

[`populate`](../../../backend-python/app/database.py) gathers unique reference IDs into a set, loads users with one `$in` query and a projection, indexes returned users in a dictionary, then mutates each task's `assignedTo`. It avoids one database call per task. Its projection also prevents returning the entire user document.

## Exercise

Trace a task from JSON `projectId` string through `to_object_id`, `new_document`, `insert_one`, and `to_json`. For each boundary write down the Python type. Then add a status filter in a branch and test matching, nonmatching, and malformed status values.

[Back to technology index](README.md)
