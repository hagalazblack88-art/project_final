from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    SECRET_KEY: str
    DATABASE_URL: str
    # DEBUG: bool = False

    model_config = SettingsConfigDict(
        # env_file="app/.env",
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


settings = Settings()
