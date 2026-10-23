# Python Backend Mastery Course

This is the chapter-based Python backend course for Kriscent Team Collab. Follow the chapters in order, read the linked project files, and complete the checkpoint at the end of each chapter.

The course project is the working FastAPI service in [`backend-python/`](../../backend-python/). No external course link or course files were attached, so the existing Python implementation is the source of truth for the examples. The code is the teacher: when a note and the implementation disagree, inspect the implementation and update the note.

## Why the old notes felt shallow

The old notes were useful as a syllabus, but not yet as a course. They named concepts such as `async`, RBAC, MongoDB, and Socket.IO without showing how one user action travels through all of them. A backend skill becomes useful when you can answer these questions for a real request:

1. What JSON can the client send?
2. Which Python type validates it?
3. How is the caller authenticated and authorized?
4. Which database query or write happens?
5. How are MongoDB values converted into JSON?
6. Which activity log or realtime event is produced?
7. Which test proves the behavior?

This course now uses one running case study to answer those questions instead of presenting isolated snippets.

## Running case study: the task board

We will follow two actions:

- Alice, an admin, creates `Build login` in the `Website` project and assigns it to Bob.
- Bob, a member of the same team, moves the task from `todo` to `in-progress`.

The request path is:

```text
HTTP JSON
  -> TaskCreate / TaskUpdate
  -> get_current_user + require_roles
  -> tasks.py router
  -> MongoDB document and timestamps
  -> to_json(ObjectId, datetime)
  -> Socket.IO event
  -> API test
```

Read the same path in the repository:

| Layer | Real code | What to look for |
| --- | --- | --- |
| Input contract | [`app/schemas/task.py`](../../backend-python/app/schemas/task.py) | `TaskCreate`, `TaskUpdate`, and `TaskStatus` |
| Authentication | [`app/dependencies.py`](../../backend-python/app/dependencies.py) | Firebase bearer token and local-user lookup |
| Endpoint | [`app/routers/tasks.py`](../../backend-python/app/routers/tasks.py) | validation, role checks, writes, and events |
| Persistence helpers | [`app/database.py`](../../backend-python/app/database.py) | `new_document`, `utcnow`, and `to_object_id` |
| JSON boundary | [`app/serialization.py`](../../backend-python/app/serialization.py) | ObjectId and UTC datetime conversion |
| Realtime | [`app/sockets.py`](../../backend-python/app/sockets.py) | token verification and team rooms |
| Proof | [`tests/test_api.py`](../../backend-python/tests/test_api.py) | `test_task_lifecycle` |
| Pure parsing example | [`app/services/assistant.py`](../../backend-python/app/services/assistant.py) | `fallback_parse` without HTTP or MongoDB |

When studying a chapter, start from the case study and follow these links. Do not only read the prose.

## Course roadmap

| Chapter | Topic | Outcome |
| --- | --- | --- |
| 0 | [Orientation](00-orientation.md) | Run the project and understand its architecture |
| 1 | [Python foundations](01-python-foundations/README.md) | Learn Python deeply before relying on FastAPI |
| 2 | [Project setup and tooling](02-project-setup-and-tooling.md) | Work reproducibly with environments and dependencies |
| 3 | [HTTP and API design](03-http-and-api-design.md) | Design predictable backend contracts |
| 4 | [FastAPI fundamentals](04-fastapi-fundamentals.md) | Build validated, dependency-injected endpoints |
| 5 | [Async MongoDB](05-async-mongodb.md) | Persist and query data without blocking |
| 6 | [Auth and security](06-auth-and-security.md) | Protect identity, roles, and resource scope |
| 7 | [Realtime and integrations](07-realtime-and-integrations.md) | Add Socket.IO events and external API calls |
| 8 | [Testing and reliability](08-testing-and-reliability.md) | Make changes safely with layered tests |
| 9 | [Deployment and operations](09-deployment-and-operations.md) | Run the service predictably in production |
| 10 | [Feature implementation](10-feature-implementation.md) | Ship a complete vertical feature slice |
| 11 | [Labs and capstone](11-labs-and-capstone.md) | Practise until you can own the backend |
| 12 | [Worked feature: filter tasks](12-worked-feature-task-filter.md) | Follow a complete change from requirement to tests |

## Technology deep dives

The main chapters teach the request flow. The [technology deep dives](technology-deep-dives/README.md) explain each library used in the Python service, including its role, the exact project files, failure modes, and hands-on tasks. Read them alongside Chapters 4–9.

## How to study

For every chapter:

1. Read the concept explanation.
2. Open the referenced implementation files.
3. Run or inspect the related tests.
4. Complete the checkpoint before moving on.

The fastest learning loop is: understand a slice, change a slice, test a slice, explain a slice.

For every chapter, use the task board as a debugging exercise:

```bash
cd backend-python
pytest tests/test_api.py -k task_lifecycle -q
pytest tests/test_assistant_parser.py -q
```

Then make one small change, such as adding a task filter or a validation rule. Follow the request through the linked files and update the test before moving on.

## Start here

```bash
cd backend-python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt

python -m app
pytest
```

The server listens on `http://localhost:5555`; interactive API docs are at `/docs`. Begin with [Chapter 0](00-orientation.md).

## Definition of done

By the end, you should be able to:

- explain a request from HTTP input through authentication, persistence, serialization, and response;
- create a typed FastAPI endpoint with validation and dependencies;
- query MongoDB asynchronously and serialize BSON values safely;
- enforce authentication, RBAC, and team/project scope server-side;
- publish realtime events only after successful writes;
- test success, validation, authorization, scope, and integration behavior;
- design, implement, and document a complete feature without copying an existing route.
