# Gemini, HTTPX, JSON, and Fallback Parsing

## The request path

[`POST /api/assistant/parse`](../../../backend-python/app/routers/assistant.py) requires an authenticated user and reads `ParseCommandRequest`. If `gemini_api_key` exists, it calls `parse_with_gemini`. That function uses `httpx.AsyncClient(timeout=15)` to call the Gemini HTTP endpoint, asks for JSON, and parses the returned text with `json.loads`. If no key is configured, the request fails, or no answer is present, the router calls `fallback_parse`.

`httpx` is the outbound HTTP client. It is independent from FastAPI's inbound route handling. `async with` closes client resources even when an exception occurs, and the timeout prevents one request from waiting indefinitely.

## Pure fallback logic

[`fallback_parse`](../../../backend-python/app/services/assistant.py) uses compiled regular expressions and a status alias dictionary. It recognizes commands such as `Create task Build login` and `Move task Build login to done`. It returns a small action dictionary; unknown commands return `{"action": None}`. This function has no network or database dependency, so [`test_assistant_parser.py`](../../../backend-python/tests/test_assistant_parser.py) can test it quickly and deterministically.

## Trust boundary

The external provider response is untrusted. The current code parses JSON but does not validate the parsed object against a Pydantic action model. It also interpolates the user's prompt into an instruction string. A stronger implementation should validate `action`, `title`, and `status` before returning the response or using it to mutate data. The current endpoint only parses a command; it does not itself create or move a task.

`parse_with_gemini` catches broad exceptions and logs a warning so fallback can run. That is intentional at the provider boundary. Do not copy broad exception catching into ordinary business code, where it could hide programming errors.

## Exercise

Test three cases: no API key, a provider timeout, and a provider response with valid JSON but an invalid status. Document current behavior first, then design a Pydantic output schema and decide how validation failure should trigger fallback.

[Back to technology index](README.md)
