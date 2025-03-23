"""
Core configuration settings for Deep-Journalist.
"""
import os
from functools import lru_cache
from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import BaseModel, Field


class Settings(BaseModel):
    """
    Application settings loaded from environment variables.
    """
    # Environment
    ENVIRONMENT: str = Field(default="development")
    DEBUG: bool = Field(default=False)
    ALLOWED_ORIGINS: List[str] = Field(default=["http://localhost:3000"])
    
    # API Settings
    API_V1_STR: str = Field(default="/api/v1")
    PROJECT_NAME: str = Field(default="Deep-Journalist")
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    
    # Google Cloud Settings
    GOOGLE_CLOUD_PROJECT: Optional[str] = None
    GOOGLE_CLOUD_LOCATION: str = "us-central1"
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None
    
    # Gemini AI Settings
    GEMINI_API_KEY: str = Field(default="")
    GEMINI_MODEL_NAME: str = "gemini-pro"
    
    # Database Settings
    DATABASE_URL: str = "sqlite:///./app.db"
    
    # Security Settings
    SECRET_KEY: str = "your-secret-key-here"  # Change in production
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Logging Settings
    LOG_LEVEL: str = "INFO"
    
    # Cache Settings
    REDIS_URL: Optional[str] = None
    CACHE_TTL: int = 3600  # 1 hour
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 60  # Free tier: 60 requests per minute
    RATE_LIMIT_WINDOW: int = 60  # 1 minute window
    
    # For backward compatibility
    @property
    def debug(self) -> bool:
        return self.DEBUG
    
    @property
    def api_host(self) -> str:
        return self.API_HOST
    
    @property
    def api_port(self) -> int:
        return self.API_PORT
    
    # Logging
    log_level: str = "INFO"
    log_file: str = "logs/deep_journalist.log"
    
    # Cache Configuration
    cache_ttl: int = 3600  # 1 hour in seconds
    max_cache_size: int = 1000
    
    # Web Scraping
    max_concurrent_scrapes: int = 5
    scraping_timeout: int = 30
    user_agent: str = Field(default="Deep-Journalist Research Bot/1.0")
    
    # Analysis Settings
    min_primary_sources: int = Field(default=3)
    min_source_score: float = Field(default=0.8)
    neutral_language_threshold: float = Field(default=0.9)

    model_config = SettingsConfigDict(
        env_file=".env.test" if os.getenv("ENVIRONMENT") == "test" else ".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"  # Allow extra fields from environment variables
    )


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    """
    return Settings()