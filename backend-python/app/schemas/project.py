from pydantic import BaseModel, ConfigDict, Field


class ProjectCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=3)
    description: str | None = None
    teamId: str = Field(min_length=1)


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
