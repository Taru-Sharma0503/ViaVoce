import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """
    Central place to read environment variables. Phase 4 services
    (gemini_service, whisper_service, tts_service) import from here
    instead of calling os.getenv() directly, so all config stays
    in one auditable place.
    """

    PORT: int = int(os.getenv("PORT", 8000))
    ENV: str = os.getenv("ENV", "development")
    ALLOWED_ORIGIN: str = os.getenv("ALLOWED_ORIGIN", "http://localhost:5000")

    GEMINI_API_KEY: str | None = os.getenv("GEMINI_API_KEY")
    WHISPER_API_KEY: str | None = os.getenv("WHISPER_API_KEY")
    TTS_PROVIDER: str = os.getenv("TTS_PROVIDER", "elevenlabs")
    TTS_API_KEY: str | None = os.getenv("TTS_API_KEY")

    # Optional path to a real trained sign-classification model checkpoint.
    # If unset (the hackathon default), SignModelWrapper falls back to the
    # built-in rule-based demo classifier - see sign_model_wrapper.py.
    SIGN_MODEL_PATH: str | None = os.getenv("SIGN_MODEL_PATH")


settings = Settings()
