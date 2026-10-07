from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_settings_path = Path(__file__).resolve()
_env_file = _settings_path.parents[4] / ".env" if len(_settings_path.parents) > 4 else ".env"


class Settings(BaseSettings):
    app_name: str = "AdvocatePro Chambers API"
    database_url: str = "postgresql+asyncpg://postgres:replace-me@localhost:5432/lms_db"
    redis_url: str = "redis://localhost:6379/0"
    api_cors_origins: str = "http://localhost:3000"
    jwt_secret_key: str = "development-only-change-this-secret-before-deployment"
    jwt_access_token_minutes: int = 30
    app_environment: str = "development"
    bootstrap_admin_name: str | None = None
    bootstrap_admin_phone: str | None = None
    bootstrap_admin_email: str | None = None
    bootstrap_admin_password: str | None = None
    reset_bootstrap_admin_password: bool = False
    ecourts_search_url: str | None = None

    model_config = SettingsConfigDict(env_file=_env_file, extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.api_cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()