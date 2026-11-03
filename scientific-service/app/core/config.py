import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "FireSync Scientific Service"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Service port & host
    PORT: int = int(os.getenv("FASTAPI_PORT", "8000"))
    HOST: str = os.getenv("FASTAPI_HOST", "0.0.0.0")
    
    # Express Backend URL for callback/integration
    EXPRESS_BACKEND_URL: str = os.getenv("EXPRESS_BACKEND_URL", "http://127.0.0.1:5000")
    
    # PostgreSQL / PostGIS Database configuration
    DB_HOST: str = os.getenv("DB_HOST", "127.0.0.1")
    DB_PORT: int = int(os.getenv("DB_PORT", "5432"))
    DB_NAME: str = os.getenv("DB_NAME", "firesync_db")
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "postgres")
    
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

settings = Settings()
