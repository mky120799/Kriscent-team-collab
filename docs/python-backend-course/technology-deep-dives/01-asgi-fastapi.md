# ASGI, FastAPI, Uvicorn, and Starlette

## What each piece does

Uvicorn is the server process that accepts connections. ASGI is the callable interface between that server and an async Python application. FastAPI defines routes, parses inputs through Pydantic, resolves dependencies, and produces OpenAPI documentation. Starlette provides underlying request, response, middleware, and session machinery. `python-socketio` wraps the FastAPI ASGI app to handle `/socket.io` traffic.

In [`app/__main__.py`](../../../backend-python/app/__main__.py), `uvicorn.run("app.main:create_app", factory=True, ...)` asks Uvicorn to call an app factory. In [`app/main.py`](../../../backend-python/app/main.py), `create_fastapi_app()` builds the HTTP app and `create_app()` wraps it with Socket.IO. `/health` and `/api/tasks` reach FastAPI; `/socket.io` reaches the Socket.IO server.

## Follow one request

For `POST /api/tasks`, FastAPI matches the router path, resolves `Database` and `SocketServer`, validates the JSON body into `TaskCreate`, and resolves `require_roles`. If any dependency raises, the handler body does not run. On success, the route writes to MongoDB and returns a Python dictionary. FastAPI serializes the returned JSON-compatible data and sends the response.

```python
router = APIRouter(prefix="/api/tasks", tags=["tasks"])

@router.post("", status_code=201)
async def create_task(payload: TaskCreate, db: Database):
    ...
```

`APIRouter` keeps a feature's paths together. `app.include_router(tasks.router)` installs them. The `tags` value groups endpoints in `/docs`.

## Dependency injection in this code

`Database = Annotated[AsyncDatabase, Depends(get_db)]` means a route parameter typed `Database` receives the connected database. `CurrentUser = Annotated[User, Depends(get_current_user)]` asks FastAPI to verify the caller first. `require_roles(...)` returns a dependency function that depends on `CurrentUser`; this is a dependency graph. FastAPI resolves that graph per request.

The annotations describe how values are supplied. Calling the route function directly in a unit test bypasses that framework behavior. Use an HTTPX ASGI client when testing routing, authentication, and validation together.

## Startup and shutdown

The lifespan context manager initializes Firebase, awaits MongoDB connection, yields while the app serves requests, and closes MongoDB on shutdown. Failure before `yield` prevents a partially initialized server from serving traffic. The current API tests call `database.connect()` themselves because their HTTPX transport does not run lifespan automatically.

## Middleware and errors

Read middleware registration in `app/main.py` from the comments: Starlette executes the last added first, so CORS is outermost among FastAPI middleware. The custom exception handlers in [`app/errors.py`](../../../backend-python/app/errors.py) turn HTTP and Pydantic validation errors into `{"message": ...}`. The unhandled-error middleware also catches unexpected failures. Its current `500` response includes `str(exc)`; that can reveal internal details and is a hardening exercise, not a recommended production error body.

## Try it

1. Run `python -m app`, open `/docs`, and locate `POST /api/tasks`.
2. Send a request without a bearer token; find the dependency that returns `401`.
3. Send malformed input; trace `RequestValidationError` into the custom `400` handler.
4. Add a trivial router with one path and verify it appears under its tag in `/docs`.

[Back to technology index](README.md)
