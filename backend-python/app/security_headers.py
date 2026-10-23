from starlette.types import ASGIApp, Message, Receive, Scope, Send

# A subset of what `helmet` sets by default. CSP is left out because this is a JSON API
# and a strict policy would break the Swagger UI served at /docs.
SECURITY_HEADERS = {
    b"x-content-type-options": b"nosniff",
    b"x-frame-options": b"SAMEORIGIN",
    b"referrer-policy": b"no-referrer",
    b"strict-transport-security": b"max-age=31536000; includeSubDomains",
    b"x-dns-prefetch-control": b"off",
    b"x-permitted-cross-domain-policies": b"none",
    b"cross-origin-opener-policy": b"same-origin",
}


class SecurityHeadersMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_with_headers(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                existing = {name.lower() for name, _ in headers}
                headers.extend(
                    (name, value) for name, value in SECURITY_HEADERS.items() if name not in existing
                )
                message["headers"] = headers
            await send(message)

        await self.app(scope, receive, send_with_headers)
