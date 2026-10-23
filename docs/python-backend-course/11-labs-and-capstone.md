# Chapter 11 — Labs, Milestones, and Capstone

## Beginner lab: notes API

Build a small notes API in a separate router:

- create, list, update, and delete notes;
- Pydantic validation;
- an in-memory repository first;
- unit tests for the repository;
- API tests for the routes.

## Intermediate lab: labels and due dates

Extend the real task feature with MongoDB persistence, manager/member authorization, filtering by status and due date, an activity log entry, a Socket.IO update event, and tests for every permission path.

## Advanced lab: notifications

Build a notification feature that persists notifications, emits a realtime notification to a user room, exposes an unread count endpoint, is idempotent, handles a failed external email provider safely, and produces useful structured logs.

## Capstone

Design and ship one complete feature without copying an existing route. Before coding, write:

- user stories and acceptance criteria;
- an API contract and error table;
- a data model and index plan;
- an authorization matrix;
- event names and payloads;
- a test matrix;
- rollout and rollback notes.

Then implement it as a vertical slice and explain every changed file in a pull-request-style summary.

## Final definition of done

- Request and response contracts are explicit.
- Invalid input is rejected consistently.
- Authentication and resource scope are enforced server-side.
- Database writes use UTC timestamps and safe identifiers.
- External calls have timeouts and a failure path.
- Events are emitted only after successful writes.
- Tests cover success and important failure paths.
- Frontend contracts are updated where needed.
- Logs diagnose failures without secrets.
- `/docs`, README material, and environment requirements are current.

## Next study session

1. Start MongoDB and run `pytest` in `backend-python`.
2. Read `app/main.py`, `app/dependencies.py`, and `app/routers/tasks.py`.
3. Call task endpoints from `/docs`.
4. Add a pure unit test to the assistant parser.
5. Implement the due-date exercise from [Chapter 10](10-feature-implementation.md).
6. Run the full test suite and write down what changed at each layer.
