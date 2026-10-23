# pytest, pytest-asyncio, HTTPX, and Test Doubles

## Test layers in the repository

Pure unit tests cover the assistant parser and serializer. API tests use `httpx.AsyncClient` with `ASGITransport(app=app)` to send requests to the Python app without a network port. Socket tests exercise the Socket.IO server. MongoDB integration tests use a unique database name for each test and drop it afterward.

[`pyproject.toml`](../../../backend-python/pyproject.toml) sets `asyncio_mode = "auto"`, so async test functions run under pytest-asyncio. [`requirements-dev.txt`](../../../backend-python/requirements-dev.txt) installs pytest, pytest-asyncio, and aiohttp in addition to runtime dependencies.

## Firebase fake

[`tests/conftest.py`](../../../backend-python/tests/conftest.py) replaces Firebase verification with a deterministic function accepting `token-<uid>`. It also prevents real Firebase initialization. This makes authorization tests reproducible and avoids needing service-account secrets. The test still exercises the route's local-user lookup and RBAC dependency.

## MongoDB fixture

The settings fixture checks whether MongoDB is reachable. If not, database tests skip. If reachable, it creates a random database name, passes it to the app, and drops it after the test. A skipped test is not evidence that database behavior works. Run with a reachable local or test MongoDB instance before claiming integration coverage.

## Mocking Socket.IO

The `emit` fixture assigns an `AsyncMock` to `app.other_asgi_app.state.sio.emit`. An assertion such as `emit.assert_awaited_with("task-created", task, room=team_id)` checks the event contract. This is useful for publication behavior; socket connection tests separately cover room admission.

## Good assertions

For a create task API test, assert status code, serialized response, persistence visible through a GET, role rejection for a member, activity log, and emitted event payload. Each assertion protects a different boundary. Avoid asserting every incidental implementation call: a refactor may keep behavior correct while changing the call graph.

## Run the suite

```bash
cd backend-python
pytest tests/test_assistant_parser.py -q
TEST_MONGO_URI=mongodb://localhost:27017 pytest
```

The first command tests pure logic. The second includes database tests when MongoDB is reachable. If the suite skips database cases, inspect the skip report before reporting success.

[Back to technology index](README.md)
