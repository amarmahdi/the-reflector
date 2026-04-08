from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://reflector:changeme@db:5432/reflector"
    SECRET_KEY: str = "CHANGE-ME"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440   # 24h
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3-pro-preview"
    MAX_BACKUPS_PER_USER: int = 10

    model_config = {"env_file": ".env"}

@lru_cache
def get_settings():
    return Settings()
