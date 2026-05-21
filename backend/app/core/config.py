from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    APP_ENV: str = "local"
    APP_NAME: str = "Aurum Radar"
    APP_DEBUG: bool = False
    API_PREFIX: str = "/api"

    DATABASE_URL: str

    OSS_ACCESS_KEY_ID: str = ""
    OSS_ACCESS_KEY_SECRET: str = ""
    OSS_BUCKET: str = "aurum-radar-demo"
    OSS_ENDPOINT: str = ""

    DASHSCOPE_API_KEY: str = ""
    DASHSCOPE_BASE_URL: str = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
    DASHSCOPE_MODEL_EXTRACT: str = "qwen-plus"
    DASHSCOPE_MODEL_SUMMARY: str = "qwen-plus"
    DASHSCOPE_MODEL_ACTION: str = "qwen-plus"

    SCHEDULER_ENABLED: bool = False


settings = Settings()
