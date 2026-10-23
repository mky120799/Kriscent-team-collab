import json
import logging
import re
from typing import Any

import httpx

logger = logging.getLogger(__name__)

GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
)

STATUS_ALIASES = {
    "todo": "todo",
    "to do": "todo",
    "in progress": "in-progress",
    "doing": "in-progress",
    "done": "done",
    "finished": "done",
    "completed": "done",
}

CREATE_PREFIX = re.compile(r"^(create task|add task)\s+", re.IGNORECASE)
MOVE_COMMAND = re.compile(r"(?:move|set|update) task (.+) to (.+)", re.IGNORECASE)


def fallback_parse(text: str) -> dict[str, Any]:
    """Rule-based parser used when Gemini is not configured or fails."""
    lower = text.lower().strip()

    # "Create task X", "Add task X", optionally ending in "in progress" / "done"
    if lower.startswith(("create task", "add task")):
        title = CREATE_PREFIX.sub("", text, count=1).strip()
        status = "todo"
        cleaned_title = title

        if title.endswith(" in progress"):
            status = "in-progress"
            cleaned_title = re.sub(r"\s*in progress$", "", title, flags=re.IGNORECASE).strip()
        elif title.endswith((" in done", " done")):
            status = "done"
            cleaned_title = re.sub(r"\s*in done$|\s*done$", "", title, flags=re.IGNORECASE).strip()

        return {"action": "create", "title": cleaned_title, "status": status}

    # "Move task X to Y", "Set task X to Y", "Update task X to Y"
    if lower.startswith(("move task", "set task", "update task")):
        match = MOVE_COMMAND.search(text)
        if match:
            title = match.group(1).strip()
            status_raw = match.group(2).strip().lower()
            return {
                "action": "update",
                "title": title,
                "status": STATUS_ALIASES.get(status_raw, "todo"),
            }

    return {"action": None}


async def parse_with_gemini(prompt: str, api_key: str) -> dict[str, Any] | None:
    """Ask Gemini to parse the command. Returns None if the call fails or gives no answer."""
    instruction = f"""You are an AI task assistant. Parse this command: "{prompt}".
Return ONLY a valid JSON object matching this schema:
{{
  "action": "create" | "update" | null,
  "title": string (if action is create or update),
  "status": "todo" | "in-progress" | "done" (default "todo" if create)
}}
No markdown formatting, just the JSON."""

    body = {
        "contents": [{"parts": [{"text": instruction}]}],
        "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"},
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(GEMINI_URL, params={"key": api_key}, json=body)
        if not response.is_success:
            return None
        text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(text) if text else None
    except Exception:
        logger.warning("Gemini API call failed, using fallback parser", exc_info=True)
        return None
