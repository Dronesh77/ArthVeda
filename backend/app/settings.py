import os
from dataclasses import dataclass, field

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "").strip()
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash").strip()
    firebase_service_account_file: str = os.getenv("FIREBASE_SERVICE_ACCOUNT_FILE", "").strip()
    firebase_service_account_json: str = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
    mongo_uri: str = os.getenv("MONGO_URI", "").strip()
    mongo_db_name: str = os.getenv("MONGO_DB_NAME", "finpilot").strip()
    allow_origins: list[str] = field(
        default_factory=lambda: (
            [o.strip() for o in os.getenv("ALLOW_ORIGINS", "*").split(",") if o.strip()]
            or ["*"]
        )
    )


settings = Settings()
