from typing import Any

from pydantic import BaseModel


class ParseCommandRequest(BaseModel):
    # Typed loosely so a non-string prompt gets the same 400 message as a missing one
    prompt: Any = None
