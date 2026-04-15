from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Face Attendance AI Service"
    model_name: str = "Facenet512"
    detector_backend: str = "opencv"
    distance_metric: str = "cosine"
    match_threshold: float = 0.32
    liveness_blur_threshold: float = 55.0
    storage_dir: Path = Path("storage")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
settings.storage_dir.mkdir(parents=True, exist_ok=True)
