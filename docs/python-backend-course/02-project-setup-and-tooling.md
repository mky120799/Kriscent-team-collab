# Chapter 2 — Set Up, Run, and Debug the Python Service

This chapter is a lab. Follow it at a terminal and explain what each command changes. The target is a local FastAPI process that can answer `/health`, generate `/docs`, and run tests with a clear understanding of which tests actually touched MongoDB.

## 1. Know where you are running commands

The repository has `frontend/`, `backend/` (Node), and `backend-python/`. The Python package is `backend-python/app/`. `python -m app` must run with `backend-python` on the import path; the simplest way is to `cd backend-python` first. Running from the repository root may import the wrong module or fail with `No module named app`.

```bash
cd backend-python
pwd
python3 --version
```

The project's [`pyproject.toml`](../../backend-python/pyproject.toml) requires Python 3.12 or newer. A compatible interpreter matters because syntax, typing behavior, and installed wheels vary by version.

## 2. Create an isolated interpreter

```bash
python3 -m venv .venv
source .venv/bin/activate
python -c 'import sys; print(sys.executable)'
python -m pip --version
```

The executable should be inside `backend-python/.venv`. A virtual environment keeps this project's packages separate from your system Python and other projects. Activation changes which `python` and `pip` commands your shell finds; it does not rewrite your global installation. Use `python -m pip` so installation targets the interpreter you just inspected.

If the interpreter path is outside `.venv`, check that activation succeeded. On Windows PowerShell, activation is `.venv\Scripts\Activate.ps1`.

## 3. Install dependencies and read the lists

```bash
python -m pip install -r requirements-dev.txt
python -m pip check
```

[`requirements-dev.txt`](../../backend-python/requirements-dev.txt) includes `-r requirements.txt`, then adds pytest, pytest-asyncio, and aiohttp. [`requirements.txt`](../../backend-python/requirements.txt) pins runtime packages: FastAPI, Uvicorn, PyMongo, Socket.IO, Firebase Admin, Pydantic, settings, HTTPX, and `itsdangerous`. Pinning gives repeatable versions when you install from these files; updating a dependency is a deliberate change that should be tested.

The files do not declare a formatter, linter, or type checker. You can add such tools later, but do not assume `ruff` or `mypy` commands work in this checkout today. The [`pyproject.toml`](../../backend-python/pyproject.toml) currently configures pytest and package metadata; it does not install the package by itself.

## 4. Configure without committing secrets

```bash
cp .env.example .env
```

Open `.env` locally and replace placeholders. [`app/config.py`](../../backend-python/app/config.py) uses `Settings(BaseSettings)` with `env_file=".env"`. The `.env` path is interpreted relative to the working directory, another reason to start commands in `backend-python`. [`.gitignore`](../../backend-python/.gitignore) excludes `.env` and `.venv/`; verify this before adding files to Git.

| Setting | Required to construct `Settings`? | What uses it |
| --- | --- | --- |
| `MONGO_URI` | Yes | AsyncMongoClient and startup ping |
| `SESSION_SECRET` | Yes | Starlette session cookie signing |
| `PORT` | No, defaults to `5555` | Uvicorn listener |
| `MONGO_DB_NAME` | No, has a default | Selected MongoDB database |
| `ENVIRONMENT` | No, defaults to development | Reload and secure cookie policy |
| Firebase project/client/key | Fields are optional, but real startup needs usable credentials | Firebase Admin initialization |
| `GEMINI_API_KEY` | No | Optional assistant provider; fallback works without it |
| `FRONTEND_URL` | No | Additional allowed CORS origin |

The example Firebase private key contains escaped `\n` characters; [`app/firebase.py`](../../backend-python/app/firebase.py) converts them into newlines when creating a service-account credential. Never paste a real key into a test, documentation, terminal output, or Git commit.

To inspect parsing without a `.env` file or Firebase startup, run:

```bash
python -c 'from app.config import Settings; s = Settings(_env_file=None, mongo_uri="mongodb://localhost:27017", session_secret="demo-only"); print(s.port, s.environment, s.allowed_origins)'
```

This constructs settings only. It does not connect to MongoDB or initialize Firebase. `allowed_origins` strips trailing slashes because browsers send an origin such as `http://localhost:5173`, without a trailing `/`.

## 5. Start the real application

With MongoDB reachable and valid Firebase service-account configuration:

```bash
python -m app
```

[`app/__main__.py`](../../backend-python/app/__main__.py) constructs `Settings` and starts Uvicorn with an app factory. [`app/main.py`](../../backend-python/app/main.py) initializes Firebase, pings MongoDB, ensures indexes, mounts routers, and wraps FastAPI with Socket.IO. In development Uvicorn reload is enabled, so code edits restart the process.

From another terminal:

```bash
curl -i http://localhost:5555/health
```

Expect HTTP `200` with the plain text `OK`. Open `http://localhost:5555/docs` to inspect generated OpenAPI docs. Most `/api` routes need a Firebase ID token; `/health` does not. A running `/docs` page does not prove that an authenticated request works, so test one protected route after configuring Firebase and a local user.

## 6. Read failures at the correct layer

| Symptom | Likely layer | First check |
| --- | --- | --- |
| `No module named app` | Working directory/import path | Are you inside `backend-python`? |
| `ModuleNotFoundError: fastapi` | Interpreter/dependencies | Does `sys.executable` point inside `.venv`? |
| Settings validation says `mongo_uri` or `session_secret` is missing | Configuration | Does `.env` exist in the current directory? |
| Startup fails during Firebase init | Credentials | Are project ID, email, and private key real and correctly formatted? |
| Startup fails during MongoDB ping | Database/network | Is the configured MongoDB server reachable? |
| `/health` works but protected API returns `401` | Request identity | Is there a valid Firebase bearer token and a matching local user? |
| Browser reports CORS failure | Origin configuration | Does `FRONTEND_URL` match the browser's exact origin? |

Do not work around a missing MongoDB connection by swallowing the startup error. A service that serves task routes without its database is unhealthy.

## 7. Run tests and interpret skips

```bash
pytest tests/test_assistant_parser.py -q
pytest -q -rs
```

The parser test is pure Python and needs no MongoDB or Firebase credentials. The integration fixtures in [`tests/conftest.py`](../../backend-python/tests/conftest.py) probe `TEST_MONGO_URI` (default `mongodb://localhost:27017`). If MongoDB is unavailable, they skip database tests. `-rs` shows why tests skipped. A green result with skipped integration tests is not evidence that database behavior passed.

When MongoDB is running:

```bash
TEST_MONGO_URI=mongodb://localhost:27017 pytest tests/test_api.py -q
```

Each test uses a unique database name and drops it afterward. Firebase is replaced by a deterministic `token-<uid>` test verifier. HTTPX sends requests directly to the ASGI app; these tests do not require a live Uvicorn port.

## 8. Understand module execution and imports

`python -m app` executes `app/__main__.py`. Importing `app.config` executes that module's top-level definitions but should not start the server. Keep network connections and irreversible work inside the app lifecycle, not in module import side effects. Tests can then import helpers without accidentally connecting to production resources.

As a small exercise, create `app/utils/strings.py` and `app/utils/__init__.py` with a pure `normalize_title` function. Add a unit test. Run it from `backend-python` with `pytest tests/test_strings.py -q`; from the repository root use `cd backend-python` or an explicit import path rather than assuming plain `pytest` sees `app` automatically.

## Checkpoint

You can finish this chapter when you can identify which Python executable is active, explain the difference between runtime and dev requirements, construct `Settings` without a `.env`, explain why Firebase credentials are needed for a real startup, get `200 OK` from `/health`, and show whether your test run executed or skipped MongoDB integration tests.

[Next: HTTP and API design](03-http-and-api-design.md) · [Technology index](technology-deep-dives/README.md)
