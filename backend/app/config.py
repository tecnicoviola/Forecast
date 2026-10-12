import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    APP_NAME: str = "Forecast - Climate Hazard Trend Analyzer"
    API_V1_PREFIX: str = "/api"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")
    
    # MongoDB settings (optional, will automatically fallback to file-based JSON NoSQL cache)
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "climate_hazard_db")
    CACHE_DIR: str = os.getenv("CACHE_DIR", os.path.join(os.path.dirname(os.path.dirname(__file__)), "data_cache"))
    
    # Rate limiting
    RATE_LIMIT: str = os.getenv("RATE_LIMIT", "60/minute")
    
    # Open-Meteo API config
    OPEN_METEO_ARCHIVE_URL: str = "https://archive-api.open-meteo.com/v1/archive"
    GEOCODING_URL: str = "https://geocoding-api.open-meteo.com/v1/search"
    REQUEST_TIMEOUT: int = 30  # seconds

settings = Settings()
