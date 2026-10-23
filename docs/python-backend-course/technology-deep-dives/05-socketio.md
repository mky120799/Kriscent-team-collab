# Socket.IO and Realtime State

## How the server is attached

[`create_app`](../../../backend-python/app/main.py) creates a `socketio.AsyncServer` and wraps the FastAPI app in `socketio.ASGIApp`. The client uses the Socket.IO protocol; this is not an ordinary raw WebSocket endpoint. The server's `cors_allowed_origins` uses the same configured origin list as FastAPI's CORS middleware.

## Connection authorization

[`app/sockets.py`](../../../backend-python/app/sockets.py) reads `auth.token` during `connect`, verifies the Firebase ID token, looks up the local user, and stores that user in the Socket.IO session. If the user has a `teamId`, the socket enters that team room automatically. `join-room` permits the user's own team or any requested room for an admin. The latter is the implemented policy; decide whether every team is appropriate for admins in your product requirements.

Room membership decides who receives a broadcast. It must be checked server side; a client supplied room name is untrusted input.

## Emitting events

The task router emits `task-created`, `task-updated`, or `task-deleted` after the MongoDB mutation. It uses `room=str(team_id)`, so sockets outside the room do not receive the event. Created and updated events carry serialized task data. Delete carries `{"taskId": ...}`. Frontend cache updates must understand these payload shapes.

```python
data = to_json(task)
await sio.emit("task-updated", data, room=str(team_id))
```

Because Socket.IO is a separate side effect, “database write succeeded” and “every connected client received the event” are different guarantees. Clients should refetch on reconnect; if guaranteed delivery is required, persist an event/outbox and track acknowledgments. This project currently does not implement an outbox.

## Test the boundary

The API fixture replaces `sio.emit` with `AsyncMock`. A task test can assert the exact event name, payload, and room without opening a browser. [`tests/test_socket.py`](../../../backend-python/tests/test_socket.py) checks connection and room behavior. Together these tests cover publishing and subscription permissions.

## Exercise

Trace `task-created` from the HTTP route to the frontend's socket listener. Write down what happens if the client disconnects immediately before the emit, and what recovery behavior the frontend should use.

[Back to technology index](README.md)
