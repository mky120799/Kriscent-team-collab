# Pydantic v2 and pydantic-settings

## Validation is a boundary

Pydantic parses external data into a declared model. Python type hints alone do not validate runtime input. In [`app/schemas/task.py`](../../../backend-python/app/schemas/task.py), `TaskCreate` and `TaskUpdate` define which fields a task request may contain. `TaskStatus` is a `Literal` type defined in `schemas/common.py`, limiting status to known values.

```python
class TaskUpdate(BaseModel):
    status: TaskStatus | None = None
    assignedTo: str | None = None
```

Here `None` also means “field omitted” after normal attribute access. If a future feature must distinguish omitted from explicitly `null`, inspect `payload.model_fields_set`. That distinction matters for clearing an assignee: `if payload.assignedTo is not None` cannot distinguish those cases.

## Parsing, domain checks, and error translation

Pydantic checks type and allowed literals; the task router checks business requirements such as a required project ID and validates MongoDB ObjectIds. The project converts Pydantic's default validation error into a `400` with a single `message` in [`app/errors.py`](../../../backend-python/app/errors.py). Generic FastAPI examples often show `422`; this service intentionally uses `400` for frontend compatibility.

Try `TaskUpdate.model_validate({"status": "done"})`, then try `{"status": "blocked"}` and inspect the exception's `errors()` list. Next compare with the HTTP response from `/api/tasks/{id}`; the exception handler transforms the message.

## Settings

[`app/config.py`](../../../backend-python/app/config.py) defines `Settings(BaseSettings)` with `env_file=".env"`. Environment variables are parsed into typed fields. `mongo_uri` and `session_secret` are required; `port` defaults to `5555`. `allowed_origins` strips trailing slashes because browser `Origin` values have none.

```python
settings = Settings(
    _env_file=None,
    mongo_uri="mongodb://localhost:27017",
    session_secret="local-test-secret",
)
assert settings.port == 5555
```

The `_env_file=None` override is useful in tests to avoid accidentally loading a developer's `.env`. Settings describe deployment configuration, while Pydantic request models describe client input. Do not use a request model as a substitute for access control: validation can prove a `teamId` is shaped correctly but cannot prove the actor may use that team.

## Exercise

Add a hypothetical `TASK_PAGE_SIZE` setting, constrain it to a sensible positive range, and test default, valid environment override, and invalid value. Do not change route behavior until you can explain where settings are created and injected.

[Back to technology index](README.md)
