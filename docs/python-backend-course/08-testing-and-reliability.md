# Chapter 8 — Testing and Reliability

## Goal

Make changes safely and keep behavior explainable.

## Test the task feature as a behavior, not a file

The task feature crosses several boundaries, so one test type cannot prove everything:

```text
fallback_parse              -> pure unit test
TaskCreate / TaskUpdate     -> API validation test
get_current_user            -> auth API test
MongoDB insert and query    -> API/integration test
sio.emit                    -> mocked side-effect assertion
cross-team access           -> authorization test
```

The best existing example is [`test_task_lifecycle`](../../backend-python/tests/test_api.py). It creates users and a project, creates a task as Alice, rejects Bob’s create attempt, lists the task as Bob, moves it, checks validation, deletes it, and verifies the realtime event. Read it alongside [`tests/conftest.py`](../../backend-python/tests/conftest.py), where `auth`, `register`, the fake Firebase verifier, and the per-test MongoDB database are defined.

## Testing pyramid

- Pure unit tests for parsers, serializers, and business rules.
- API tests for request/response behavior and authorization.
- Integration tests for MongoDB indexes and queries.
- Realtime tests for Socket.IO authentication and room membership.
- A small number of end-to-end tests for the most important user flows.

## Existing test strategy

The project replaces Firebase with a deterministic test verifier, gives each test a fresh database name, and mocks Socket.IO emission so the API contract can be asserted without a live browser.

Read [`tests/conftest.py`](../../backend-python/tests/conftest.py) before writing new API tests. The helpers `auth()` and `register()` keep test intent readable.

The fake token format is deliberate: `auth("alice")` sends `Bearer token-alice`, and the test verifier returns `{"uid": "alice"}`. This tests the application’s dependency wiring deterministically without making a network call to Firebase. It does not prove Firebase itself works; that belongs to a separate integration check.

## Minimum test matrix for a feature

| Case | Question |
| --- | --- |
| Success | Does the intended actor get the correct response? |
| Validation | What happens with missing or malformed input? |
| Authentication | What happens with no or invalid credentials? |
| Authorization | What happens when the role is insufficient? |
| Scope | Can the actor access another team’s resource? |
| Side effect | Was activity logged and the right event emitted? |
| Not found | Is missing data reported consistently? |

## How to read a failure

When a task test fails, locate the first boundary that changed:

- `400` can mean Pydantic rejected the request before the router ran **or** the route rejected a business/input rule; inspect the `message` and the relevant code path;
- `401` means the identity dependency stopped the request;
- `403` means authentication succeeded but the role check failed;
- `404` means the lookup found no resource;
- a response that passes but an event assertion that fails usually means the write and the side effect disagree about serialization or room selection.

This is why the test should assert status, response body, stored behavior, and side effect separately instead of only checking `response.status_code == 200`.

## Checkpoint

For a new task status filter, add a success test, an invalid-status test, an empty-result test, and a test proving the filter is combined with the project scope. If the route emits an event or logs activity, assert those side effects too. Then run the focused test and the full suite:

```bash
pytest tests/test_api.py -k task -q
pytest -q
```

## Build a test from acceptance criteria

Suppose the feature is “members can move tasks in their own team, but not another team's task.” Start with an observable contract, not a helper name:

```python
async def test_member_cannot_move_another_teams_task(client):
    # Arrange two teams, one member of team A, and a task owned by team B.
    response = await client.put(
        f"/api/tasks/{other_team_task_id}",
        headers=auth("member_a"),
        json={"status": "done"},
    )
    assert response.status_code in (403, 404)
```

The setup placeholders stand for the user/team/project creation calls already demonstrated in `test_api.py`. Choose `403` or `404` as the contract, then assert one exact value and confirm the task remains unchanged. A status assertion alone would miss a forbidden write that happened before the response.

## Understand fixtures and isolation

`settings` probes MongoDB with a one-second server-selection timeout. A failed probe calls `pytest.skip`; it does not fake database behavior. When reachable, it assigns a random database name. The `app` fixture creates the ASGI app and explicitly calls `database.connect`; it closes the database after yielding. `client` wraps that app with HTTPX's `ASGITransport`. This bypasses a network socket but still runs FastAPI routing and dependencies. The separate `server_url` fixture in `test_socket.py` starts Uvicorn on a local port because a real Socket.IO client needs an actual connection.

The `fake_firebase` fixture runs automatically. It replaces both token verification and Firebase initialization. Tests can use `auth("alice")`, which sends `Bearer token-alice`, and the fake returns `{"uid": "alice"}`. This proves local authorization logic, not Google's token cryptography.

## Test failures, not only success

For one API operation, build a matrix:

| Input/actor | Expected result | State or side effect to assert |
| --- | --- | --- |
| Valid manager create | `201` | Document exists and event has correct room |
| Member create | `403` | No document or event |
| No token | `401` | No write |
| Invalid ObjectId | `400` or endpoint's documented contract | No write |
| Valid-looking missing ID | `404` | No event |
| Cross-team actor | Chosen `403`/`404` policy | Other team's document unchanged |

The custom validation handler turns Pydantic errors into `400`, so do not assume a framework-default `422`. Existing route code has some `404` behavior for malformed path IDs; tests should reflect actual behavior until an intentional API change is made.

## Run tests honestly

```bash
cd backend-python
pytest tests/test_assistant_parser.py -q
pytest tests/test_api.py -q -rs
pytest tests/test_socket.py -q -rs
```

The first command has no MongoDB requirement. The others need a reachable MongoDB instance; `-rs` displays skips. If you change only a parser, run its focused tests first. If you change auth, sockets, or serialization, run the related integration tests too. A passing suite with skipped database tests is incomplete evidence for database behavior.

[Next: Deployment](09-deployment-and-operations.md) · [Testing stack](technology-deep-dives/07-testing-stack.md)
