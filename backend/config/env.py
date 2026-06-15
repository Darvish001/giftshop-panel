import os

from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional


class Setting(BaseSettings):
    ADMIN_USERNAME: str
    ADMIN_PASSWORD: str
    URLPATH: str = "dashboard"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    DOC: bool = False
    SSL_KEYFILE: Optional[str] = None
    SSL_CERTFILE: Optional[str] = None
    JWT_SECRET_KEY: str
    JWT_ACCESS_TOKEN_EXPIRES: int = 86400  # in seconds

    # Installer / Docker-only variables. They are not used by the app itself,
    # but allowing them prevents Pydantic from crashing when they exist in .env.
    PUBLISH_PORT: Optional[int] = None
    DOMAIN: Optional[str] = None
    ENABLE_SSL: Optional[bool] = False

    model_config = ConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
        extra="ignore",
    )


config = Setting()