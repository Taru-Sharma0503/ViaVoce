import asyncio
import os
import uuid
import wave
from typing import Optional

from piper.voice import PiperVoice

from app.config import settings

STATIC_AUDIO_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "audio")
os.makedirs(STATIC_AUDIO_DIR, exist_ok=True)

# Maps the client's TTSControls voice preference to a local Piper voice
# model file (.onnx) living in settings.PIPER_VOICES_DIR. Swap the
# filenames here to change which downloaded voice backs each option -
# see the install notes for how to fetch voice files.
VOICE_MAP = {
    "warm": "en_US-lessac-medium.onnx",
    "clear": "en_US-amy-medium.onnx",
    "calm": "en_US-ljspeech-medium.onnx",
}
DEFAULT_VOICE = "warm"

# Loaded Piper voices are cached by filename - loading an ONNX model
# is the expensive part, synthesis itself is cheap once loaded.
_voice_cache: dict[str, PiperVoice] = {}


def _load_voice(model_filename: str) -> Optional[PiperVoice]:
    if model_filename in _voice_cache:
        return _voice_cache[model_filename]

    model_path = os.path.join(settings.PIPER_VOICES_DIR, model_filename)
    if not os.path.exists(model_path):
        print(
            f"[tts_service] Piper voice model not found at {model_path} - "
            f"see install notes to download it. Skipping speech synthesis."
        )
        return None

    try:
        voice = PiperVoice.load(model_path)
        _voice_cache[model_filename] = voice
        return voice
    except Exception as err:
        print(f"[tts_service] failed to load Piper voice '{model_filename}': {err}")
        return None


async def synthesize_speech(text: str, voice: str = DEFAULT_VOICE) -> Optional[str]:
    """
    Synthesizes `text` to speech with a fully local Piper voice model
    and returns a URL path the client can play directly (served by
    FastAPI's StaticFiles mount at /audio - see main.py). Returns None
    if the requested voice model isn't downloaded or synthesis fails;
    the server already treats a null audioUrl as "no audio for this
    translation" rather than erroring - unchanged from the ElevenLabs
    version.

    In production this would still want to move off local disk to
    blob storage (S3/GCS) - that simplification is unrelated to this
    migration and was already true before.
    """
    if not text.strip():
        return None

    model_filename = VOICE_MAP.get(voice, VOICE_MAP[DEFAULT_VOICE])
    piper_voice = _load_voice(model_filename)
    if piper_voice is None:
        return None

    filename = f"{uuid.uuid4().hex}.wav"
    filepath = os.path.join(STATIC_AUDIO_DIR, filename)

    try:
        # Piper's synthesis is synchronous/CPU-bound - run it in a
        # worker thread so it doesn't block the FastAPI event loop
        # while other requests (frame processing, captions) are live.
        await asyncio.to_thread(_synthesize_to_file, piper_voice, text, filepath)
    except Exception as err:
        print(f"[tts_service] Piper synthesis failed: {err}")
        return None

    return f"/audio/{filename}"


def _synthesize_to_file(piper_voice: PiperVoice, text: str, filepath: str) -> None:
    with wave.open(filepath, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)  # 16-bit PCM
        wav_file.setframerate(piper_voice.config.sample_rate)
        for audio_bytes in piper_voice.synthesize_stream_raw(text):
            wav_file.writeframes(audio_bytes)