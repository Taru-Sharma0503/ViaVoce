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

    # --- Speech-to-text: local faster-whisper model, no API key or
    # network call required. Model weights are cached locally after
    # the first run (see whisper_service.py). ---
    WHISPER_MODEL_SIZE: str = os.getenv("WHISPER_MODEL_SIZE", "base")
    WHISPER_DEVICE: str = os.getenv("WHISPER_DEVICE", "cpu")
    WHISPER_COMPUTE_TYPE: str = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

    # --- Sentence generation: Gemini free tier if configured, with a
    # local Ollama model as a free fallback, then a deterministic
    # template as the last resort. See gemini_service.py. ---
    GEMINI_API_KEY: str | None = os.getenv("GEMINI_API_KEY")
    OLLAMA_BASE_URL: str | None = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3")

    # --- Text-to-speech: local Piper voice models (.onnx), no API key.
    # Directory holding downloaded voice files - see tts_service.py
    # and the install notes for how to fetch them. ---
    PIPER_VOICES_DIR: str = os.getenv("PIPER_VOICES_DIR", "./voices")

    # Optional path to a real trained sign-classification model checkpoint.
    # If unset (the hackathon default), SignModelWrapper falls back to the
    # built-in rule-based demo classifier - see sign_model_wrapper.py.
    SIGN_MODEL_PATH: str | None = os.getenv("SIGN_MODEL_PATH")


settings = Settings()