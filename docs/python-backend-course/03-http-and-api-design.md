# Chapter 3 — HTTP and API Design

## Goal

Understand and design the protocol FastAPI exposes.

## One contract, from client to response

Use task creation as the concrete contract:

```bash
curl -X POST http://localhost:5555/api/tasks \
  -H 'Authorization: Bearer <Firebase ID token>' \
  -H 'Content-Type: application/json' \
  -d '{"title":"Build login","projectId":"<project-id>","assignedTo":"<user-id>"}'
```

The public contract is implemented across several files, not in one route declaration:

| Contract piece | Implementation |
| --- | --- |
| HTTP method and path | `@router.post` in [`app/routers/tasks.py`](../../backend-python/app/routers/tasks.py) |
| JSON body | [`TaskCreate`](../../backend-python/app/schemas/task.py) |
| bearer authentication | [`get_current_user`](../../backend-python/app/dependencies.py) |
| role rule | `require_roles("ADMIN", "MANAGER")` in the task router |
| status code | `status.HTTP_201_CREATED` |
| response serialization | [`to_json`](../../backend-python/app/serialization.py) |
| realtime contract | `task-created` with the team room |
| executable proof | [`test_task_lifecycle`](../../backend-python/tests/test_api.py) |

Changing one piece can break a consumer. For example, changing `projectId` to an `ObjectId` in the response would expose MongoDB representation details that the React client does not expect. The database may use BSON; the HTTP contract uses strings.

## Learn the contract

- HTTP methods, status codes, headers, cookies, and content types;
- path parameters versus query parameters versus JSON bodies;
- authentication headers and CORS;
- idempotency and the difference between `PUT`, `PATCH`, and `POST`;
- stable response shapes and useful error messages;
- pagination, filtering, sorting, and validation at the API boundary.

## Existing endpoint examples

| Concern | Example |
| --- | --- |
| Health check | `GET /health` |
| Collection read | `GET /api/projects` |
| Create | `POST /api/tasks` |
| Partial update | `PUT /api/tasks/{task_id}` |
| Delete | `DELETE /api/tasks/{task_id}` |
| Query filter | `GET /api/tasks?projectId=...` |
| Auth header | `Authorization: Bearer <Firebase ID token>` |

## Error design

An API consumer should be able to distinguish `400` malformed input, `401` missing or invalid identity, `403` insufficient permission, `404` missing or invisible resources, `409` conflicts, and `500` unexpected failures.

This project commonly returns `{"message": "..."}` for errors so the React client can display them consistently.

Walk the task examples in [`test_api.py`](../../backend-python/tests/test_api.py): missing authentication is `401`, a member trying to create a task is `403`, malformed status is `400`, and a missing task on delete is `404`. The test file is the most precise description of the current contract because it asserts the exact response body.

## Idempotency and side effects

`POST /api/tasks` creates a new resource and is not automatically idempotent: retrying the same request may create two tasks. `PUT /api/tasks/{task_id}` expresses replacement/update semantics for a known resource, but the current implementation only changes the supplied fields and therefore behaves like a partial update. If a client retries it, the status converges on the same value, which is useful.

The route also emits Socket.IO events. The implementation writes first and emits second. That ordering is part of the contract: clients must not receive `task-created` for a task that failed to persist.

## Checkpoint

Use `/docs`, `curl`, or the `httpx` tests to exercise task creation with:

1. a valid body;
2. a missing `projectId`;
3. an invalid `projectId`;
4. no token;
5. a member token.

Record the status code, `{"message": ...}` body, and whether a Socket.IO event should exist. Link each observed result to the line in [`tasks.py`](../../backend-python/app/routers/tasks.py) that produces it.

## From raw HTTP to domain input

An HTTP request contains a method, path, headers, and optional body. The JSON body is bytes on the wire; FastAPI parses it and Pydantic creates `TaskCreate`. The `Authorization` header is separate from the body. A caller cannot gain manager privileges by sending `"role": "MANAGER"` in task JSON because the role comes from the authenticated local user document.

For `GET /api/tasks?projectId=...`, `projectId` is a query parameter. For `PUT /api/tasks/{task_id}`, `task_id` comes from the path and `TaskUpdate` from the JSON body. Use a path for the identity of a resource, a query for collection filtering, and a body for fields being created or changed. These conventions help a client predict an endpoint before reading its code.

## Write an error table

| Situation | Current task API behavior | Client response |
| --- | --- | --- |
| Create succeeds | `201` plus serialized task | Render the task without another GET |
| No bearer token | `401` | Refresh identity or prompt sign-in |
| Member attempts create | `403` | Show insufficient permission |
| Missing/invalid `projectId` on list | `400` | Fix the request |
| Task update ID not found | `404` | Remove stale card or refetch |
| Duplicate unique database key | `409` via middleware | Show conflict |

This describes current behavior. The task router returns `404` for a malformed update path ID, while list uses `400` for malformed `projectId`. If you standardize them, change tests and frontend expectations together.

## Pagination and ordering are contracts

The current task list calls `.find({"projectId": project_id}).to_list()` without a limit or explicit sort. MongoDB natural order is not a reliable user-visible order. For a larger collection define a limit, stable sort key, and cursor or offset strategy. A compound `(createdAt, _id)` cursor gives a tie-breaker. Offset pagination is simpler but can shift when tasks are inserted between page requests.

## CORS is separate from authorization

CORS controls whether JavaScript in a browser may read a cross-origin response. It does not prove that a user can change a task. A non-browser client can call the API without a browser CORS check. Firebase authentication and server-side resource scope remain necessary regardless of allowed origins.

## Exercise: design before implementation

Design `GET /api/tasks?projectId=...&status=...&limit=...`. Specify types, defaults, maximum limit, sort order, response shape, error body, authentication, team scope, and what happens for unknown status. Add HTTPX tests for the important rows, implement the route, then compare `/docs` with the contract you wrote.

[Next: FastAPI](04-fastapi-fundamentals.md)
