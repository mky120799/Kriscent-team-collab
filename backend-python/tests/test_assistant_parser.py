import pytest

from app.services.assistant import fallback_parse


@pytest.mark.parametrize(
    ("command", "expected"),
    [
        ("Create task Write docs", {"action": "create", "title": "Write docs", "status": "todo"}),
        ("add task Fix login in progress", {"action": "create", "title": "Fix login", "status": "in-progress"}),
        ("Create task Ship release done", {"action": "create", "title": "Ship release", "status": "done"}),
        ("Create task Deploy in done", {"action": "create", "title": "Deploy", "status": "done"}),
        ("Move task Write docs to done", {"action": "update", "title": "Write docs", "status": "done"}),
        ("set task Fix login to doing", {"action": "update", "title": "Fix login", "status": "in-progress"}),
        ("Update task API to todo", {"action": "update", "title": "API", "status": "todo"}),
        ("update task API to somewhere", {"action": "update", "title": "API", "status": "todo"}),
        ("what is the weather", {"action": None}),
        ("move task without target", {"action": None}),
    ],
)
def test_fallback_parse(command: str, expected: dict) -> None:
    assert fallback_parse(command) == expected
