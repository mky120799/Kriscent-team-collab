from pydantic import BaseModel


class UserCreate(BaseModel):
    firebaseUid: str
    name: str
    email: str


class ProfileUpdate(BaseModel):
    name: str | None = None


class RoleUpdate(BaseModel):
    role: str | None = None
