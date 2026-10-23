# Chapter 6 — Authentication, Authorization, and Security

## Goal

Protect identity, permissions, and data scope explicitly.

## Read one request in three security layers

Use Bob moving a task as the concrete example:

```http
PUT /api/tasks/<task_id>
Authorization: Bearer <Firebase ID token>
Content-Type: application/json

{"status": "in-progress"}
```

The request should be reasoned about in this order:

1. **Authentication:** Is the bearer token present, valid, and linked to a local user?
2. **Authorization:** Does that user have a role allowed by this operation?
3. **Resource scope:** Does that user belong to the team that owns this task?

These are not interchangeable. A valid token answers only “who.” A `MEMBER` role answers only “which class of actions.” Neither answer proves that the task belongs to the caller’s team.

## Three questions

- Authentication: “Who is this caller?”
- Authorization: “May this caller perform this action?”
- Scope: “Which team or project may this caller access?”

## How this project handles them

- [`app/dependencies.py`](../../backend-python/app/dependencies.py) verifies Firebase bearer tokens and loads the local user.
- `require_roles("ADMIN", "MANAGER")` is a reusable coarse-grained authorization dependency.
- Routers still need resource-level checks such as team membership or project ownership.
- CORS, secure cookies, security headers, and configuration are applied in the app factory.

### Authentication: token → local user

[`get_current_user`](../../backend-python/app/dependencies.py) performs the authentication boundary:

```python
if credentials is None:
    raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Unauthorized: No token provided")

decoded = await firebase.verify_id_token(credentials.credentials)
user = await db[Collections.USERS].find_one({"firebaseUid": decoded["uid"]})
```

The database lookup matters. Firebase proves the identity of the Firebase account; this application still needs its own role and `teamId`. The dependency rejects both an invalid token and a valid token for a user not registered in this database.

### Authorization: role → allowed operation

The task endpoints make the role rule visible at the function signature:

```python
user: Annotated[User, Depends(require_roles("ADMIN", "MANAGER"))]
```

That is why Alice can create and delete tasks while Bob receives `403` for create. The update route deliberately permits all three roles because moving a Kanban card is a member action. See the role assertions in [`test_task_lifecycle`](../../backend-python/tests/test_api.py).

### Scope: role is not ownership

The current task router is a useful teaching example because it shows an unfinished security boundary. `get_tasks` requires authentication but does not yet verify that the caller belongs to the project’s team. `update_task` and `delete_task` first find by task `_id` and do not yet compare the task’s `teamId` with the caller’s team. A caller who knows another project or task ID could therefore reach a path that role checks alone do not protect. `create_task` also accepts an optional body `teamId`, so production code should verify that the actor can create in that target team rather than trusting the client value.

Treat this as a real security exercise, not as an implied feature. A safer update query would include the caller’s allowed team, or the router would fetch the task and call a dedicated scope-checking function before mutating it. Add a cross-team test before claiming the feature is secure.

## Security rules

- Never trust frontend-only permission checks.
- Never log tokens, private keys, or sensitive request bodies.
- Use UTC-aware timestamps.
- Escape user input used in regex searches; the user search implementation demonstrates this.
- Use production-only secure cookie settings.
- Return useful errors without exposing internal stack traces.

## Authorization matrix for the task feature

| Operation | Anonymous | Member | Manager | Admin | Scope required |
| --- | --- | --- | --- | --- | --- |
| List by project | `401` | allowed after membership check | allowed | allowed | project/team membership |
| Create | `401` | `403` | allowed | allowed | target team |
| Move or assign | `401` | allowed | allowed | allowed | task’s team |
| Delete | `401` | `403` | allowed | allowed | task’s team |

This table records intended scope behavior alongside current role behavior. The current delete route allows managers as well as admins; cross-team scope is not yet enforced. Each intended scope rule needs a failing test and implementation before it can be claimed as a product guarantee.

## Common mistakes in this code path

- Checking `user["role"]` in every router instead of reusing `require_roles`.
- Trusting `teamId` from the request body without comparing it to the actor’s membership.
- Returning `404` for malformed IDs without deciding whether the API contract wants `400`.
- Logging the bearer token while debugging Firebase failures.
- Assuming a Socket.IO room is an authorization check; room admission must also be validated in [`app/sockets.py`](../../backend-python/app/sockets.py).

## Checkpoint

Add a cross-team authorization test for `PUT /api/tasks/{task_id}` and `DELETE /api/tasks/{task_id}`. First make the test fail against the current implementation, then add the smallest scope check that makes it pass. Keep the existing matrix tests for `401`, `403`, and success, and explain why the fix belongs at the resource boundary rather than in the frontend.

## Token verification is only step one

The browser obtains a Firebase ID token. `get_current_user` verifies it, extracts `uid`, and searches `users` by `firebaseUid`. This local document contains the role and `teamId` used for business permissions. A valid Firebase token for someone with no local record is rejected. Conversely, a local user document does not establish identity without a verified token. The service account in `.env` enables backend verification; it is never sent to the browser.

The Firebase Admin verifier is synchronous, so [`verify_id_token`](../../backend-python/app/firebase.py) uses `asyncio.to_thread`. This keeps synchronous verification work away from the event loop. The socket connection handler uses the same verifier but has its own flow for room admission.

## Cookies versus bearer authorization

The login route verifies an ID token and stores a small user summary in a signed session cookie. The protected REST routes use `HTTPBearer` and verify a bearer token on each request; they do not authorize from that cookie. A browser possessing a session cookie but omitting `Authorization` still gets `401` on protected routes. This is easy to misunderstand because both mechanisms exist in the app.

## Resource checks belong in the database operation

For a member updating a task, a strong query combines identity of the task with allowed scope:

```python
task = await db[Collections.TASKS].find_one_and_update(
    {"_id": task_oid, "teamId": user["teamId"]},
    {"$set": changes},
    return_document=ReturnDocument.AFTER,
)
```

This is an example design, not the current implementation. It prevents a cross-team match in the same atomic operation. Admins who are allowed to work across teams need a different allowed-scope filter; define that product rule explicitly. A separate `find_one` followed by an update using only `_id` can introduce a time-of-check/time-of-use gap if ownership changes between those operations.

## Chat exposes the same principle

`GET /api/messages` checks team membership for non-admins. `POST /api/messages` currently checks `teamId` format and content but does not make the same membership check before inserting. The Socket.IO room restriction controls reception, not whether an HTTP caller can write to a team. Add a cross-team POST test and enforce the same server-side scope rule for both reading and writing.

## Threat-focused lab

1. Register two teams and a member of team A in a test database.
2. Create a task and chat channel in team B.
3. Attempt task list, task update, task delete, and message POST as the team A member.
4. Record actual status and whether database state changed. Do not assume `403` merely because the UI hides an action.
5. Choose `403` versus `404` for cross-team resources, implement the policy consistently, and assert no state change or event.

[Next: Realtime](07-realtime-and-integrations.md) · [Firebase deep dive](technology-deep-dives/04-firebase-auth.md)
