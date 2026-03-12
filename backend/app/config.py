from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "student_development_db"
    secret_key: str = "default-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    openai_api_key: str = "sk-placeholder"
    gemini_api_key: str = "AIzaSyBn3a5CDNSUNOQT468-IJ0DwtzHIV28VxU"
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()
