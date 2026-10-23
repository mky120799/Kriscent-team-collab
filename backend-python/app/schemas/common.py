from typing import Literal

Role = Literal["ADMIN", "MANAGER", "MEMBER"]
ROLES: tuple[Role, ...] = ("ADMIN", "MANAGER", "MEMBER")

TaskStatus = Literal["todo", "in-progress", "done"]
