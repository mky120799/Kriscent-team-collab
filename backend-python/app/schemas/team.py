from pydantic import BaseModel


class TeamCreate(BaseModel):
    name: str | None = None
    description: str | None = None


class AddMemberRequest(BaseModel):
    userId: str | None = None
    role: str | None = None
