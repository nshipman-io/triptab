from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App settings
    APP_NAME: str = "Triptab API"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/triptab"
    DATABASE_URL_SYNC: str = "postgresql://postgres:postgres@localhost:5432/triptab"

    # JWT
    SECRET_KEY: str = "your-super-secret-key-change-in-production"

    # OpenAI (for Pydantic AI)
    OPENAI_API_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""

    # Admin user (created on startup if password is set)
    ADMIN_EMAIL: str = "support@triptab.io"
    ADMIN_PASSWORD: str = ""  # Set via ADMIN_PASSWORD env var

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://triptab.io",
        "http://triptab.io",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
