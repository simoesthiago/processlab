"""
ProcessLab Configuration

Simplified settings for local-first usage with SQLite.
"""

from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "ProcessLab API"
    API_V1_STR: str = "/api/v1"
    
    # CORS - Local development origins
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3004",
        "http://127.0.0.1:3004",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Database (SQLite for local-first)
    SQLITE_PATH: str = "./processlab.db"
    
    # Local Storage (for uploaded files)
    STORAGE_PATH: str = "./data_storage"

    # OpenAI (for ProcessWizard)
    OPENAI_API_KEY: str = ""

    # Logging
    LOG_LEVEL: str = "INFO"
    JSON_LOGS: bool = False
    
    model_config = SettingsConfigDict(
        case_sensitive=True, 
        env_file=".env", 
        extra='ignore'
    )


settings = Settings()
