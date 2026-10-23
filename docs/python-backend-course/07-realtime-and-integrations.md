# Chapter 7 — Realtime Events and External Integrations

## Goal

Connect the API to systems outside a single request while keeping failures controlled.

## Socket.IO patterns

Learn namespaces, rooms, event names, authentication, and payload design. Emit an event after a successful database mutation so clients never receive a success event for data that was not persisted.

The task router is the main example:

1. Validate the request and actor.
2. Write the task.
3. Log activity.
4. Serialize the task.
5. Emit `task-created` or `task-updated` to the team room.
6. Return the serialized data to the caller.

See [`app/sockets.py`](../../backend-python/app/sockets.py) for socket authentication and rooms.

## External HTTP calls

Use `httpx.AsyncClient` with a timeout and a failure path. Keep provider-specific details inside a service module.

The assistant service in [`app/services/assistant.py`](../../backend-python/app/services/assistant.py) tries Gemini, parses the response, logs failures, and falls back to a deterministic parser when the key is missing or the provider fails.

Reliable integration patterns include validating provider output, setting a short timeout, keeping optional providers from making the whole feature unusable, logging without secrets, and testing the fallback independently from the network call.

## Checkpoint

Add a `task-comment-added` event. Persist the comment first, emit only after persistence succeeds, and test the event with an `AsyncMock`.

## Full walkthrough: send a team chat message

Read [`send_message`](../../backend-python/app/routers/messages.py) beside [`test_chat_message_is_broadcast_to_team_room`](../../backend-python/tests/test_socket.py). The route trims `content`, checks `teamId`, converts the ID to an ObjectId, builds a timestamped document, inserts it, serializes a sender summary, emits `new-message` to the team room, and returns that same payload. The integration test starts a real Uvicorn server, connects a Socket.IO client with a fake Firebase token, posts a message over HTTP, waits for the socket event, and compares the event to the HTTP response.

This is stronger than only mocking `emit`: it proves the HTTP and Socket.IO paths cooperate over the actual protocol. The test still substitutes Firebase token verification and needs MongoDB. Read the fixture before claiming it tests production credentials.

## Connection, rooms, and trust

The frontend's [`connectSocket`](../../frontend/src/socket/index.ts) obtains a Firebase ID token, puts it in `socket.auth`, and reconnects when authentication state changes. The backend `connect` handler verifies that token, looks up the local user, saves a socket session, and joins the user's team room. `join-room` allows admins or members of the requested team. The room string is a routing address, not proof of permission; server-side admission is what protects messages.

There is an important asymmetry: `get_messages` checks whether a non-admin belongs to the requested team, but `send_message` currently validates the team ID without checking that membership. A caller with a valid token can attempt a POST for another team. The Socket.IO room check does not repair the HTTP write path. Add a cross-team POST test before treating chat as scoped correctly.

## What happens when emit fails?

The chat route catches a Socket.IO emit exception, logs it, and returns the saved message. The client sees success for persistence even if a live broadcast failed. The task routes await `sio.emit` without a local catch; a failure there may propagate after the task was already written. These are different product contracts. Decide explicitly whether realtime is best effort, whether the client should refetch after failures/reconnects, and whether a durable event outbox is needed.

No implementation here guarantees every connected client receives every event. A room broadcast is a live notification; MongoDB remains the source of truth.

## HTTPX and Gemini failure path

The assistant's [`parse_with_gemini`](../../backend-python/app/services/assistant.py) uses `httpx.AsyncClient(timeout=15)`. A successful HTTP status is followed by nested JSON extraction and `json.loads` on the model's text. A timeout, non-success response, malformed shape, or JSON parse error returns `None`, allowing the router to call `fallback_parse`. The fallback recognizes a small command grammar. A syntactically valid but semantically wrong provider object is not currently validated by a response model; the [Gemini lesson](technology-deep-dives/06-gemini-httpx.md) shows that improvement.

## Guided exercises

1. Trace a chat message from frontend token to `new-message` event. Name the input, database document, HTTP response, and event payload types at each boundary.
2. Write a test where Bob belongs to team A and posts to team B. Record current behavior, then propose a membership check in `send_message`.
3. Mock `sio.emit` to raise after a chat insert and after a task insert. Compare HTTP responses and persisted documents. Explain why a retry of `POST` may duplicate a write.
4. Disconnect the socket before the broadcast. Reconnect and use `GET /api/messages?teamId=...` to recover history. What ordering does the current query guarantee?

[Next: Testing](08-testing-and-reliability.md) · [Socket.IO deep dive](technology-deep-dives/05-socketio.md)

## Deep reading: `create_socket_server` line by line

Open [`app/sockets.py`](../../backend-python/app/sockets.py) while reading this section. Socket.IO runs alongside FastAPI, but it has its own connection lifecycle and authorization decisions. The object returned by `create_socket_server(settings)` is stored on `fastapi_app.state.sio`, then `socketio.ASGIApp(sio, other_asgi_app=fastapi_app)` routes socket traffic to Socket.IO and everything else to FastAPI. There is no separate Python process for the socket server in this implementation.

```python
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=settings.allowed_origins,
)
```

`AsyncServer` supplies coroutine-based handlers. `async_mode="asgi"` integrates it with Uvicorn's ASGI serving model. `cors_allowed_origins` restricts browser origins for the Socket.IO handshake; it does **not** identify a user or authorize a room. A non-browser client may not be constrained by browser CORS at all.

### `connect`: authenticate the transport

Socket.IO calls `connect(sid, environ, auth)` for each connection. `sid` is this connection's Socket.IO session identifier. It is not the database user ID. `environ` carries handshake information; the current handler does not inspect it. The client supplies `auth` during `socket.connect()`:

```typescript
const token = await auth.currentUser?.getIdToken();
socket.auth = { token };
socket.connect();
```

The Python handler reads `(auth or {}).get("token")`, so absent `auth` does not cause an attribute error. Missing token produces `ConnectionRefusedError("No token provided")`. The handler then verifies the Firebase ID token, extracts its `uid`, and fetches the corresponding local MongoDB user. These are two different checks: Firebase says the token belongs to an identity; the local user document provides role and team. A valid token with no local user is rejected as `"User not found"`. An exception during verification or database lookup is collapsed to `"Unauthorized"`.

```python
await sio.save_session(sid, {"user": user})
```

The session saves the local user for later Socket.IO events on the same connection. It is separate from Starlette's signed HTTP cookie session. The currently loaded user document can become stale if an admin changes the role or team while the socket stays connected. A permission-sensitive room join should consider reloading the current user, disconnecting/rejoining sockets after role changes, or both.

If the user has `teamId`, `enter_room(sid, str(user["teamId"]))` subscribes the connection to the team's room. MongoDB stores an `ObjectId`, while Socket.IO room names here are strings. A mismatch such as emitting to an ObjectId rather than `str(team_id)` could silently send to a different room name. The route emitters deliberately use strings.

### `join-room`: authorize a subscription

The client can emit `join-room` with any payload. The handler returns immediately for false-like values, converts the requested value to a string, retrieves the socket session, and compares it with the saved user's team. A normal user may join only their team; an `ADMIN` may join any requested room under the current policy.

```python
if user.get("role") == "ADMIN" or user_team_id == target_room:
    await sio.enter_room(sid, target_room)
```

This check is essential. A room name is an address, not a secret. The client UI calls `socket.emit("join-room", teamId)` in [`ChatWindow.tsx`](../../frontend/src/components/chat/ChatWindow.tsx), but a malicious client can send any team ID regardless of what the UI displays. The server decides whether to join.

The handler currently gives no acknowledgment for a denied join. From the client perspective, silence could mean denial, a lost connection, or a timing issue. If the UI needs to distinguish these, define an explicit acknowledgment response and test it. Do not infer authorization success from having emitted `join-room`.

### `disconnect`: finish the connection

The handler retrieves the saved session and logs the email if present. Socket.IO removes the connection's room memberships when it disconnects. The handler does not delete chat messages or database users. A reconnect is a new connection with a new `sid`, requiring token verification and room admission again.

## A complete message timeline

Use Alice in team A sending `"Hi"` to trace both transports:

| Time | Actor and operation | Data/state transition |
| --- | --- | --- |
| 1 | Frontend `connectSocket()` | Firebase token goes into `socket.auth`; Socket.IO connects |
| 2 | Python `connect` | Token verified, local Alice loaded, socket joins room `str(team_A_id)` |
| 3 | Frontend `sendMessage` mutation | HTTP POST `/api/messages` with bearer token and JSON body |
| 4 | FastAPI `send_message` | Pydantic parses body, HTTP dependency verifies token, route trims content and parses `teamId` |
| 5 | MongoDB | Message document inserted with `senderId`, `teamId`, timestamps |
| 6 | FastAPI router | Document is serialized, sender summary added, `new-message` emitted to team room |
| 7 | Socket.IO server | Every currently connected socket in that room is offered the event |
| 8 | Frontend RTK Query listener | Rejects other-team events, avoids duplicate `_id`, appends message to cached history |
| 9 | HTTP response | Sender receives the same serialized message as the event payload |

The frontend listener in [`message.api.ts`](../../frontend/src/store/services/message.api.ts) registers when the message query cache entry loads, and unregisters when it is removed. The deduplication check matters because the sender may learn about its own new message through both the mutation response and the socket event. The history endpoint is still needed: a client disconnected at step 7 cannot receive that past live event.

## Delivery and consistency: four different outcomes

| Write | Emit | Current chat response | What another client may see |
| --- | --- | --- | --- |
| Fails | Not attempted | Error | No new message |
| Succeeds | Succeeds | `201` | Live event plus later history |
| Succeeds | Raises | `201` after logging | No live event; history contains message |
| Succeeds | Client disconnected | `201` | Disconnected client must refetch history |

The third row follows from the `try/except` around `sio.emit` in `send_message`. Task routes behave differently: they do not catch emit failure, so the write may succeed while HTTP reports an error. A client retrying that `POST` could create a duplicate task. Decide idempotency and event delivery policy per feature. Socket.IO itself is not a database transaction.

## Tests: what each one proves

[`test_chat_messages`](../../backend-python/tests/test_api.py) uses `AsyncMock` for `sio.emit`. It proves the route calls `emit("new-message", message, room=team_id)` with the expected payload and that the history endpoint returns the message. It does not prove a connected socket receives it.

[`test_chat_message_is_broadcast_to_team_room`](../../backend-python/tests/test_socket.py) starts Uvicorn, connects a real Socket.IO client with a fake token, sends an HTTP message, awaits an `asyncio.Queue`, and compares the received event with the HTTP response. It proves protocol integration and room delivery to that client. Firebase is still faked, MongoDB is real, and it does not prove delivery after disconnect.

[`test_socket_rejects_invalid_token`](../../backend-python/tests/test_socket.py) checks a connection error, not an HTTP `401`. A socket handshake and an API request are different authorization paths and should each have tests.

Run the protocol tests with a reachable MongoDB instance:

```bash
cd backend-python
TEST_MONGO_URI=mongodb://localhost:27017 pytest tests/test_socket.py -q -rs
```

The test fixture starts a local Uvicorn process and connects a real Socket.IO client using the WebSocket transport. If MongoDB is unreachable, the settings fixture skips; read `-rs` output before treating the run as proof.

## Debug a missing message, one boundary at a time

1. **Connection:** Is `socket.connected` true? If `connect_error` fires, inspect token presence and the local user lookup. A valid Firebase user who has no local MongoDB record is still rejected.
2. **Room:** Is the socket in `str(teamId)`? The frontend may emit `join-room` before its connection finishes; the server auto-joins the saved user's own team on connect, which covers that team but not an admin switching rooms. A denied `join-room` currently has no acknowledgment.
3. **Write:** Did `POST /api/messages` return `201`, and does the message appear in MongoDB? A body validation error or missing token stops before emit.
4. **Emit:** Was `new-message` emitted to `room=str(team_oid)`? Compare the exact string with the room name created at connection.
5. **Cache listener:** Is there an active `getMessages` cache entry? `message.api.ts` attaches its listener only after `cacheDataLoaded` and removes it when the cache entry is removed. It filters by `message.teamId` and deduplicates `_id`.
6. **Recovery:** If the client was offline at emit time, refetch history. The current history query sorts ascending and then limits to 100; that returns the **earliest** 100 matching records, despite its “latest chat history” docstring. A production fix must reverse the sort for selection and then present results in the desired display order.

This sequence isolates transport, authorization, persistence, emission, frontend subscription, and replay. A single “Socket.IO is broken” diagnosis hides which boundary failed.

## Security exercise with a concrete failure

The current `get_messages` route checks that a non-admin user belongs to the requested team. `send_message` does not make the equivalent check before insertion and broadcast. A member of team A who knows team B's ID can attempt to POST to team B. The room admission check only controls who receives events; it does not protect the write. Write a test with two teams that asserts a team A member cannot send to B, and confirm no message was inserted or emitted. That test should fail on the current implementation. Then add a server-side membership check to the HTTP route.

## Design exercise: acknowledgments and replay

Suppose the product asks for “every chat message appears exactly once, even after reconnect.” Define what “once” means: one database document, one socket event, one UI row, or all three. A practical design might use a client-generated idempotency key for POST, a unique database constraint, server-assigned message IDs, client deduplication by `_id`, and history refetch on reconnect. A plain `sio.emit` cannot by itself guarantee exactly-once delivery. Write tests for duplicate POST, lost emit, reconnect, and two clients sending simultaneously before implementing this design.
