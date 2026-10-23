# 1.8 — Files, JSON, Paths, and Configuration

## Paths with `pathlib`

```python
from pathlib import Path


config_path = Path("config") / "local.json"
if config_path.exists():
    text = config_path.read_text(encoding="utf-8")
```

`pathlib` is clearer and safer than manually concatenating path strings.

## JSON boundaries

```python
import json


payload = {"title": "Build API", "done": False}
encoded = json.dumps(payload)
decoded = json.loads(encoded)
```

JSON supports strings, numbers, booleans, null, arrays, and objects. It does not natively support `datetime`, `ObjectId`, or arbitrary Python classes. Convert those values deliberately at the boundary.

## Environment variables and secrets

```python
import os


environment = os.getenv("ENVIRONMENT", "development")
```

For a real application, centralize this in a typed settings class. Do not call `os.getenv` throughout every route.

The project uses [`pydantic-settings`](../../../backend-python/app/config.py): settings are loaded once, validated, and injected through the app state.

## Configuration design

Separate:

- code defaults that are safe everywhere;
- environment-specific values such as URLs and database names;
- secrets that must only come from the environment or secret manager.

Never commit `.env`, private keys, Firebase credentials, or API keys. Never print the settings object wholesale.

## Time and serialization

```python
from datetime import UTC, datetime


created_at = datetime.now(UTC)
```

Use aware UTC values internally. Convert to the public string format in one serialization layer so every endpoint behaves consistently.

## Exercises

1. Load a JSON task fixture with `pathlib` and validate it with Pydantic.
2. Write a serializer that converts a UTC datetime to an ISO-8601 string.
3. Design a settings object for a notification provider without exposing its secret.
4. Test behavior when a required environment variable is missing.

## Repository connection

Read [`app/config.py`](../../../backend-python/app/config.py) and [`app/serialization.py`](../../../backend-python/app/serialization.py) together.
