from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url

_settings_path = Path(__file__).resolve()
_env_file = _settings_path.parents[4] / ".env" if len(_settings_path.parents) > 4 else ".env"


class Settings(BaseSettings):
    app_name: str = "AdvocatePro Chambers API"
    # The `.env` file defines DATABASE_URL (uppercase); alias it to this field
    # so pydantic picks it up at runtime.
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:shivjanam@localhost:5432/lms_db",
        alias="DATABASE_URL",
    )
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

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_asyncpg_url(cls, value: str) -> str:
        """Accept standard PostgreSQL URLs from hosted database dashboards.

        Neon provides PostgreSQL URLs with ``sslmode`` and
        ``channel_binding`` query parameters. SQLAlchemy's asyncpg driver uses
        ``ssl`` and does not consume ``channel_binding``, so translate those
        options before creating the engine.
        """
        url = make_url(str(value))
        if url.drivername in {"postgres", "postgresql"}:
            url = url.set(drivername="postgresql+asyncpg")
        if url.drivername != "postgresql+asyncpg":
            return url.render_as_string(hide_password=False)

        query = dict(url.query)
        sslmode = query.pop("sslmode", None)
        query.pop("channel_binding", None)
        if sslmode is not None:
            query.setdefault("ssl", sslmode)
        return url.set(query=query).render_as_string(hide_password=False)

    model_config = SettingsConfigDict(env_file=_env_file, extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.api_cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
