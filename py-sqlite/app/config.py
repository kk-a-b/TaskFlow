from __future__ import annotations

from datetime import timedelta, timezone
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parent.parent
TZ_SHANGHAI = timezone(timedelta(hours=8))


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "py-sqlite"
    api_prefix: str = "/api/v1"
    sqlite_path: str = str(ROOT_DIR / "app.db")
    secret_key: str = "dev-secret-change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7


settings = Settings()
