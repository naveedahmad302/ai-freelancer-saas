from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"

    database_url: str = "postgresql://postgres:postgres@localhost:5432/freelancer_saas"
    mongodb_uri: str = "mongodb://localhost:27017/freelancer_saas"
    redis_url: str = "redis://localhost:6379"

    pinecone_api_key: str = ""
    pinecone_index: str = "freelancer-memory"

    elevenlabs_api_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
