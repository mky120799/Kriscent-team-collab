import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response
from pymongo.errors import DuplicateKeyError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

logger = logging.getLogger(__name__)


def _format_validation_error(error: dict) -> str:
    """Turn the first Pydantic error into a Joi-style message, e.g. '"name" is required'."""
    loc = [str(part) for part in error.get("loc", ()) if part not in ("body", "query", "path")]
    field = ".".join(loc) or "body"
    ctx = error.get("ctx") or {}

    match error.get("type"):
        case "missing":
            return f'"{field}" is required'
        case "string_too_short" if ctx.get("min_length") == 1:
            return f'"{field}" is not allowed to be empty'
        case "string_too_short":
            return f'"{field}" length must be at least {ctx.get("min_length")} characters long'
        case "string_type":
            return f'"{field}" must be a string'
        case "literal_error":
            return f'"{field}" must be one of [{ctx.get("expected", "")}]'
        case "extra_forbidden":
            return f'"{field}" is not allowed'
        case "json_invalid":
            return "Invalid JSON body"
        case _:
            return f'"{field}" {error.get("msg", "is invalid")}'


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    return JSONResponse({"message": exc.detail}, status_code=exc.status_code, headers=exc.headers)


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    errors = exc.errors()
    message = _format_validation_error(errors[0]) if errors else "Invalid request"
    return JSONResponse({"message": message}, status_code=status.HTTP_400_BAD_REQUEST)


class UnhandledErrorMiddleware(BaseHTTPMiddleware):
    """Turn unexpected exceptions into JSON errors.

    Runs inside the CORS middleware so error responses still carry CORS headers,
    which a plain `Exception` handler (handled outside all middleware) would not.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        try:
            return await call_next(request)
        except DuplicateKeyError as exc:
            logger.warning("Duplicate key: %s", exc.details)
            return JSONResponse(
                {"success": False, "message": "A record with this value already exists"},
                status_code=status.HTTP_409_CONFLICT,
            )
        except Exception as exc:
            logger.exception("Unhandled error on %s %s", request.method, request.url.path)
            return JSONResponse(
                {"success": False, "message": str(exc) or "Internal Server Error"},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
