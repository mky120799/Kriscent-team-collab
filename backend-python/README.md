# Kriscent Team Collab: Python API

A FastAPI port of the Node/Express backend in [`../backend`](../backend). It exposes the same REST endpoints, JSON shapes and Socket.IO events, so the React frontend works against either backend without changes.

## Learn Python backend development

Use the repository-wide [Python Backend Mastery course](../docs/python-backend-course/README.md) as the course for this service. It teaches the Python foundations behind this code, FastAPI request handling, async MongoDB access, Firebase authentication, RBAC, Socket.IO, external integrations, testing, deployment, and how to implement a complete feature as a vertical slice.

## Tech stack

| Concern | Library |
|---|---|
| Web framework | FastAPI + Uvicorn (ASGI) |
| Database | MongoDB via PyMongo's native async API |
| Validation | Pydantic v2 |
| Real-time | python-socketio (compatible with `socket.io-client` v4) |
| Auth | Firebase Admin SDK (ID token verification) + role-based access control |
| AI assistant | Google Gemini over `httpx`, with a rule-based fallback parser |
| Config | pydantic-settings (`.env`) |
| Tests | pytest + pytest-asyncio, against a real MongoDB |

## Project layout

```
app/
  main.py              App factory: middleware, routers, Socket.IO mount
  config.py            Settings loaded from environment
  database.py          Mongo connection, indexes, populate helper
  dependencies.py      Auth (Firebase bearer token), RBAC, shared dependencies
  sockets.py           Socket.IO auth, team rooms
  errors.py            Error responses ({"message": ...})
  security_headers.py  Helmet-style security headers
  routers/             auth, users, teams, projects, tasks, messages, activity, assistant
  schemas/             Pydantic request models
  services/            Activity logging, AI command parsing
tests/                 API, Socket.IO and unit tests
```

## Running locally

Requires Python 3.12+ and MongoDB.

```bash
cd backend-python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env   # fill in Mongo, Firebase and session values
python -m app
```

The server listens on `http://localhost:5555`. Interactive API docs are at `http://localhost:5555/docs`; click **Authorize** and paste a Firebase ID token to call protected endpoints.

Point the frontend at it with `VITE_API_URL=http://localhost:5555/api`, the same value the Node backend uses.

## Tests

```bash
TEST_MONGO_URI=mongodb://localhost:27017 pytest
```

Each test uses a fresh, randomly named database that is dropped afterwards. Firebase token verification is replaced with a stub, so no Firebase credentials are needed. If MongoDB is not reachable, the database tests are skipped.

## Deployment

- Build command: `pip install -r requirements.txt`
- Start command: `python -m app` (reads `PORT` from the environment)
- Set `ENVIRONMENT=production` so the session cookie is `Secure` and `SameSite=None`, which a frontend on a different domain needs.

## Differences from the Node backend

- **Sessions** are stored in a signed cookie (`kriscent.sid`) instead of a MongoDB session store. The API authenticates every request with the Firebase bearer token, so nothing reads the session server-side.
- **Bad input returns 400** (invalid ids, wrong field types, missing task title) where Mongoose cast/validation errors used to return 500.
- **Empty project descriptions are accepted.** The frontend sends `description: ""` when the field is blank, which the Joi schema rejected.
- **User search** escapes regex characters and is combined with the `projectId` filter instead of replacing it.
- **`task-deleted`** is broadcast to the task's own team room rather than the deleting user's team.
