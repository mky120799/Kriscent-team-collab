# Python Backend Mastery

These notes are a practical course, not just a list of Python topics. Every concept should connect to the working FastAPI service and to a user-visible behavior.

The running example is the task board: an admin creates a task, a member moves it, MongoDB stores it, and the team receives a Socket.IO event. Start with the [course index](python-backend-course/README.md), then follow the same request through the linked implementation files.

The most important study habit is to read a note beside its code. For example:

| Question | Read |
| --- | --- |
| What input is allowed? | [`TaskCreate` and `TaskUpdate`](../backend-python/app/schemas/task.py) |
| Who may call the endpoint? | [`get_current_user` and `require_roles`](../backend-python/app/dependencies.py) |
| What does the request do? | [`tasks.py`](../backend-python/app/routers/tasks.py) |
| How are IDs and timestamps stored? | [`database.py`](../backend-python/app/database.py) |
| How is the response made JSON-safe? | [`serialization.py`](../backend-python/app/serialization.py) |
| What proves the behavior? | [`test_task_lifecycle`](../backend-python/tests/test_api.py) |

Start here: [Python Backend Mastery course index](python-backend-course/README.md)
