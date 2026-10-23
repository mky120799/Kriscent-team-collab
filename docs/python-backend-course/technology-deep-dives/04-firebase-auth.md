# Firebase Authentication, Sessions, and RBAC

## Identity flow

The React client sends a Firebase ID token as `Authorization: Bearer <token>`. [`get_current_user`](../../../backend-python/app/dependencies.py) extracts it using `HTTPBearer`, calls `firebase.verify_id_token`, and finds the local user by `firebaseUid`. Firebase establishes identity; the MongoDB user document supplies application role and team membership.

The Firebase Admin SDK's token verification function is synchronous. [`app/firebase.py`](../../../backend-python/app/firebase.py) calls it through `asyncio.to_thread`, preventing that work from blocking the event loop. The `verify_id_token` call is repeated for HTTP requests and Socket.IO connections.

## Failure states

No bearer credential returns `401`. An invalid token also returns `401`. A valid token without a local user returns `401` with a different message. A recognized user with a disallowed role returns `403` from `require_roles`. The tests in [`tests/test_api.py`](../../../backend-python/tests/test_api.py) exercise these cases with a fake verifier, so tests need no Firebase service account.

## Sessions and cookies

The app installs Starlette `SessionMiddleware` and the login endpoint sets session data, but the protected API dependencies use the bearer token on every request. Do not assume the cookie authenticates a route. In production the session cookie uses `Secure` and `SameSite=None`; this concerns browser cookie delivery, not role authorization.

## Resource scope is a separate rule

`require_roles("ADMIN", "MANAGER")` answers whether a role may perform an action in general. It does not check whether a specific task belongs to the actor's team. The current task routes do not consistently enforce cross-team scope. Treat this as a known gap in the implementation. A robust update should include an allowed team in the MongoDB filter or check the task's team before writing; a cross-team test must prove the behavior.

For `POST /api/tasks`, client supplied `teamId` must be checked against the actor's authority. Pydantic validating that it is a string does not grant permission.

## Exercise

Draw a four-row matrix for anonymous, member, manager, and admin callers against task create and update. Add a separate column for same-team versus other-team resources. Compare your intended policy with actual tests and mark the unimplemented cases.

[Back to technology index](README.md)
