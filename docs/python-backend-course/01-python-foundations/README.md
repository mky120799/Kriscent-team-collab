# Python Foundations — In-Depth Section

This section teaches Python itself before FastAPI becomes the focus. The goal is to understand the runtime, data model, standard library, error behavior, typing, asynchronous execution, and testing patterns that make backend code reliable.

## Learning order

| Topic | Outcome |
| --- | --- |
| [1.1 Syntax and control flow](01-syntax-and-control-flow.md) | Understand names, values, objects, conditions, loops, and comprehensions |
| [1.2 Data structures](02-data-structures.md) | Choose lists, tuples, dictionaries, and sets deliberately |
| [1.3 Functions and modules](03-functions-and-modules.md) | Design callables, scopes, packages, and imports |
| [1.4 OOP and the data model](04-oop-and-data-model.md) | Use classes, dataclasses, protocols, and dunder methods appropriately |
| [1.5 Errors and exceptions](05-errors-and-exceptions.md) | Design failure behavior, cleanup, and logging |
| [1.6 Typing and Pydantic](06-typing-and-pydantic.md) | Make contracts visible and validate external data |
| [1.7 Async and concurrency](07-async-and-concurrency.md) | Understand coroutines, tasks, timeouts, and blocking work |
| [1.8 Files, JSON, and configuration](08-files-json-and-config.md) | Work safely with paths, serialization, environments, and secrets |
| [1.9 Testing and code quality](09-testing-and-code-quality.md) | Write deterministic unit and async tests |
| [1.10 Backend practice](10-backend-practice.md) | Combine the fundamentals in a framework-free service core |

## How to study

For every topic, read the explanation, run each example, change the example and predict the result, complete the exercises, then connect the idea to the repository files.

Use Python 3.12 or newer, matching the backend’s `requires-python` setting.

```bash
cd backend-python
source .venv/bin/activate
python --version
python
```

## The mental model

Python code manipulates objects. A variable is a name bound to an object; it is not a box that permanently owns a value. Function arguments pass object references, mutable objects can change in place, and immutable objects are replaced when “changed”. This explains bugs involving shared state, default arguments, caches, and request data.

## Completion standard

You are ready for the FastAPI chapters when you can explain identity versus equality, choose a data structure and its tradeoff, write functions with explicit side effects, split code into importable modules, design meaningful exceptions, add useful type annotations, validate external data, explain when `async` helps, and write deterministic unit tests.

## Repository connection

After this section, revisit [`app/services/assistant.py`](../../../backend-python/app/services/assistant.py) for parsing and fallback behavior, [`app/config.py`](../../../backend-python/app/config.py) for typed settings, [`app/database.py`](../../../backend-python/app/database.py) for async functions and shared state, and [`tests/test_assistant_parser.py`](../../../backend-python/tests/test_assistant_parser.py) for isolated unit tests.
