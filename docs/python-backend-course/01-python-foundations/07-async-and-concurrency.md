# 1.7 — Async, Concurrency, and the Event Loop

## What `async` means

An `async def` function returns a coroutine object. It does not run until awaited or scheduled:

```python
async def get_value() -> int:
    return 42


value = await get_value()
```

`await` gives control back while the operation is waiting for I/O. It does not make CPU-heavy work faster.

## Sequential versus concurrent I/O

```python
import asyncio


async def load_all(ids: list[str]) -> list[dict]:
    return await asyncio.gather(*(load_one(item_id) for item_id in ids))
```

`gather` can reduce total waiting time when operations are independent. Do not use it for writes that must happen in order or for unbounded user input without a concurrency limit.

## Limit concurrency

```python
import asyncio


async def limited_load(ids: list[str]) -> list[dict]:
    semaphore = asyncio.Semaphore(10)

    async def load_with_limit(item_id: str):
        async with semaphore:
            return await load_one(item_id)

    return await asyncio.gather(*(load_with_limit(item_id) for item_id in ids))
```

This prevents a burst of requests from overwhelming a database or provider.

## Timeouts and cancellation

```python
import asyncio


result = await asyncio.wait_for(provider_call(), timeout=5)
```

Cancellation is cooperative. Do not swallow `asyncio.CancelledError` accidentally; shutdown and request cancellation depend on it.

## Blocking code is dangerous in an async server

This blocks the event loop:

```python
import time


async def bad_handler():
    time.sleep(5)
```

Use an async library for I/O. For unavoidable blocking work, move it to a thread or process deliberately with `asyncio.to_thread`, while considering whether the work belongs in a background worker.

## Async context managers and iterators

```python
async with httpx.AsyncClient(timeout=15) as client:
    response = await client.get(url)
```

An async iterator can stream results without loading everything into memory:

```python
async for document in collection.find({}):
    process(document)
```

## Exercises

1. Write two slow coroutines and compare sequential execution with `gather`.
2. Add a semaphore to limit ten concurrent provider calls.
3. Add a timeout and fallback to a simulated external integration.
4. Identify any synchronous network or sleep operation that would block a FastAPI route.

## Repository connection

Trace the `await` calls in [`app/main.py`](../../../backend-python/app/main.py), [`app/database.py`](../../../backend-python/app/database.py), and [`app/services/assistant.py`](../../../backend-python/app/services/assistant.py).

## Worked trace: a request while MongoDB is waiting

Suppose Bob updates a task and MongoDB takes 40 ms to answer. `await db[...].find_one_and_update(...)` suspends that coroutine while I/O is pending. The event loop can run another request coroutine. When MongoDB completes, the original coroutine resumes with the updated document. This is concurrency, not parallel execution of Python CPU instructions. If the same handler calls `time.sleep(0.04)`, it blocks the event loop and delays unrelated requests.

The Firebase Admin SDK's `auth.verify_id_token` is synchronous, so [`app/firebase.py`](../../../backend-python/app/firebase.py) runs it via `asyncio.to_thread`. The awaitable waits for a worker thread; other requests can continue. Threads do not make CPU-heavy Python code automatically scalable, but they keep a blocking library call off the event loop.

## Ordering and failure

In task creation, `await insert_one` finishes before `await sio.emit`. Moving the emit before the write could tell clients about a task that was never stored. Even in the current order, a database success followed by an emit failure leaves a stored task without an event. Decide whether the product needs best-effort notification, a retry, or a durable outbox. That is a business consistency requirement, not something `async` solves automatically.

`asyncio.gather` starts independent operations concurrently, but by default an exception from one awaited result propagates to the caller. For dependent steps such as "create task, then log activity using its ID", sequential awaits are clearer and correct. Use bounded concurrency for fan-out to external providers.

## Try and predict

```python
import asyncio

async def work(name: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return name

async def main() -> None:
    first = await work("first", 0.1)
    second = await work("second", 0.1)
    together = await asyncio.gather(work("a", 0.1), work("b", 0.1))
    print(first, second, together)

asyncio.run(main())
```

Predict the order and approximate waiting time for the sequential pair versus `gather`. Then replace `asyncio.sleep` with `time.sleep` and explain why the `gather` case no longer gains concurrency.
