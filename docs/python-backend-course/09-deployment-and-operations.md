# Chapter 9 — Deployment and Operations

## Goal

Run the service predictably outside a laptop.

## Topics

- environment-specific settings and secret management;
- health checks and startup failure behavior;
- ASGI deployment and process management;
- logs, request context, and useful error details;
- database backups, indexes, and migration strategy;
- CORS and secure cookie settings in production;
- graceful shutdown and connection cleanup.

The current deployment contract is documented in [`backend-python/README.md`](../../backend-python/README.md): install dependencies, run `python -m app`, set `ENVIRONMENT=production`, and provide MongoDB, session, Firebase, and optional Gemini settings.

## Production checklist

- `/health` returns successfully after dependencies are ready.
- MongoDB credentials are supplied through the environment.
- `ENVIRONMENT=production` enables secure cookie behavior.
- The deployed frontend origin is in the allowed CORS list.
- No token, private key, or secret is printed in logs.
- MongoDB indexes exist before traffic depends on them.
- Shutdown closes the database connection cleanly.

## Checkpoint

Run the app with production-like settings, verify `/health`, verify CORS from the deployed frontend origin, and confirm no secret is printed in logs.

## What actually starts in production

[`app/__main__.py`](../../backend-python/app/__main__.py) creates `Settings` and starts Uvicorn using the `app.main:create_app` factory. In production `reload` is false. The factory configures FastAPI, routers, middleware, and Socket.IO. The FastAPI lifespan initializes Firebase, awaits a MongoDB ping and index setup, and closes the connection at shutdown. A deployment platform must provide the environment values from Chapter 2; do not ship a `.env` with real credentials inside the repository or image.

## Startup versus liveness

MongoDB is pinged before the app is ready. If that fails, startup fails instead of serving requests that cannot persist data. `/health` returns plain text `OK`; it does not run a new database query on every check. It proves the process responds after startup, not that every dependency remains healthy indefinitely. If a platform needs deep readiness checks, design those separately and consider their cost.

## Browser origins and cookies

CORS receives `settings.allowed_origins`, allows credentials, and permits all methods and headers. An origin is scheme + host + port: `http://localhost:5173` differs from `http://localhost:5174`. `FRONTEND_URL` has its trailing slash stripped. In production, `SessionMiddleware` uses `Secure` and `SameSite=None` for cross-site cookies, but protected API routes still use Firebase bearer tokens.

```bash
curl -i -X OPTIONS http://localhost:5555/api/projects \
  -H 'Origin: http://localhost:5173' \
  -H 'Access-Control-Request-Method: GET'
```

Expect `access-control-allow-origin` only for an allowed origin. A browser CORS error can hide the underlying API failure; inspect both the server response and the origin configuration.

## Proxy headers and trust

Uvicorn currently uses `proxy_headers=True` and `forwarded_allow_ips="*"`. This trusts forwarding headers from any peer. That is appropriate only if the service is reachable solely through a trusted proxy. If direct connections are possible, restrict trusted proxy addresses so clients cannot influence scheme or client IP information. Confirm the deployment topology before changing the setting.

## Logs, errors, and data safety

The app logs startup, auth, sockets, and provider fallback. `UnhandledErrorMiddleware` currently returns `str(exc)` in a `500` response, which may reveal internal details. A production improvement is to log the exception with a request identifier and return a stable generic message. Do not log tokens, Firebase private keys, or Gemini keys. The current Firebase initializer logs booleans indicating credential presence, not credential contents.

The Python and Node backends share MongoDB collection names and public JSON shapes. Before routing traffic to Python, verify existing documents are interpreted consistently, including ObjectIds, timestamps, optional fields, and `__v`. New indexes should follow measured queries. Backups and restore drills are operational responsibilities; passing API tests cannot prove recoverability.

## Deployment exercise

1. Prepare an isolated environment with MongoDB and Firebase credentials.
2. Run with `ENVIRONMENT=production`, an appropriate session secret, and the frontend origin.
3. Verify `/health`, `/docs`, authenticated `/api/auth/me`, and a CORS preflight.
4. Stop the process and confirm graceful database close.
5. Make MongoDB unavailable at startup and record the failure; do not report the service ready.

[Back to course index](README.md)
