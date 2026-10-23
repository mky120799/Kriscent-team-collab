from functools import cached_property

from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://kriscent-team-collab.vercel.app",
]


class Settings(BaseSettings):
    """Application settings, loaded from environment variables and `.env`."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 5555
    environment: str = "development"

    mongo_uri: str
    mongo_db_name: str = "Krescent-collab"

    session_secret: str
    frontend_url: str | None = None

    firebase_project_id: str | None = None
    firebase_client_email: str | None = None
    firebase_private_key: str | None = None

    gemini_api_key: str | None = None

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @cached_property
    def allowed_origins(self) -> list[str]:
        origins = [*DEFAULT_ALLOWED_ORIGINS, self.frontend_url]
        # Browsers never send a trailing slash in the Origin header
        return [origin.strip().rstrip("/") for origin in origins if origin]
