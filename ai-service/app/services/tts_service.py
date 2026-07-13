import os
import uuid
from typing import Optional

import httpx

from app.config import settings

STATIC_AUDIO_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "audio")
os.makedirs(STATIC_AUDIO_DIR, exist_ok=True)

# Maps the client's TTSControls voice preference to an ElevenLabs premade
# voice ID. These are ElevenLabs' publicly documented default voices -
# swap in account-specific voice IDs once real TTS branding is chosen.
VOICE_MAP = {
    "warm": "21m00Tcm4TlvDq8ikWAM",   # "Rachel"
    "clear": "EXAVITQu4vr4xnSDxMaL",  # "Bella"
    "calm": "MF3mGyEYCl7XYWbV9V6O",   # "Elli"
}
DEFAULT_VOICE = "warm"


async def synthesize_speech(text: str, voice: str = DEFAULT_VOICE) -> Optional[str]:
    """
    Synthesizes `text` to speech and returns a URL path the client can
    play directly (served by FastAPI's StaticFiles mount at /audio -
    see main.py). Returns None if TTS isn't configured or the call
    fails; the server already treats a null audioUrl as "no audio for
    this translation" rather than erroring.

    In production this would upload to blob storage (S3/GCS) and
    return a signed URL instead of writing to local disk - local
    static files are a hackathon-scope simplification.
    """
    if settings.TTS_PROVIDER != "elevenlabs":
        print(f"[tts_service] TTS_PROVIDER={settings.TTS_PROVIDER} is not implemented in this "
              f"build - only 'elevenlabs' is wired up. Returning no audio.")
        return None

    if not settings.TTS_API_KEY:
        print("[tts_service] TTS_API_KEY not configured - skipping speech synthesis")
        return None

    voice_id = VOICE_MAP.get(voice, VOICE_MAP[DEFAULT_VOICE])
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                url,
                headers={
                    "xi-api-key": settings.TTS_API_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "text": text,
                    "model_id": "eleven_monolingual_v1",
                    "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
                },
            )
            response.raise_for_status()
            audio_bytes = response.content
    except Exception as err:
        print(f"[tts_service] ElevenLabs request failed: {err}")
        return None

    filename = f"{uuid.uuid4().hex}.mp3"
    filepath = os.path.join(STATIC_AUDIO_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(audio_bytes)

    return f"/audio/{filename}"
