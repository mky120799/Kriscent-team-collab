from pydantic import BaseModel


class MessageCreate(BaseModel):
    content: str | None = None
    teamId: str | None = None
