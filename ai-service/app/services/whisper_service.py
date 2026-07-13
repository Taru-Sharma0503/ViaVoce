import base64
import io
import re
from typing import Optional

from openai import OpenAI

from app.config import settings

DATA_URL_PATTERN = re.compile(r"^data:.*;base64,")

_client: Optional[OpenAI] = None


def _get_client() -> Optional[OpenAI]:
    global _client
    if _client is not None:
        return _client
    if not settings.WHISPER_API_KEY:
        return None
    _client = OpenAI(api_key=settings.WHISPER_API_KEY)
    return _client


def transcribe_audio(audio_data: str) -> Optional[str]:
    """
    Decodes a base64 audio chunk (as produced by the client's
    MediaRecorder, see client/src/hooks/useSpeechCapture.js) and sends
    it to Whisper for transcription. Returns None - not a fake
    transcript - if the API key isn't configured or the call fails,
    so the caller (captions.handlers.js on the Node side) can
    correctly treat this as "no caption available" rather than
    displaying a made-up result.
    """
    client = _get_client()
    if client is None:
        print("[whisper_service] WHISPER_API_KEY not configured - skipping transcription")
        return None

    try:
        raw = DATA_URL_PATTERN.sub("", audio_data)
        audio_bytes = base64.b64decode(raw)

        # The OpenAI SDK expects a file-like object with a name attribute
        # carrying the extension, so it knows how to handle the container format.
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = "chunk.webm"

        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
        )
        text = (transcript.text or "").strip()
        return text or None
    except Exception as err:
        print(f"[whisper_service] transcription failed: {err}")
        return None
