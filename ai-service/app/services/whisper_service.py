import base64
import io
import re
from typing import Optional

from faster_whisper import WhisperModel

from app.config import settings

DATA_URL_PATTERN = re.compile(r"^data:.*;base64,")

_model: Optional[WhisperModel] = None


def _get_model() -> WhisperModel:
    """
    Loads the faster-whisper model once and reuses it across requests.
    First call downloads and caches the model weights locally (via
    Hugging Face Hub) - subsequent calls, including across restarts,
    are fully offline. No API key, no per-request network call.
    """
    global _model
    if _model is None:
        print(
            f"[whisper_service] loading local faster-whisper model "
            f"'{settings.WHISPER_MODEL_SIZE}' (device={settings.WHISPER_DEVICE}, "
            f"compute_type={settings.WHISPER_COMPUTE_TYPE}) - one-time cost"
        )
        _model = WhisperModel(
            settings.WHISPER_MODEL_SIZE,
            device=settings.WHISPER_DEVICE,
            compute_type=settings.WHISPER_COMPUTE_TYPE,
        )
    return _model


def transcribe_audio(audio_data: str) -> Optional[str]:
    """
    Decodes a base64 audio chunk (as produced by the client's
    MediaRecorder, see client/src/hooks/useSpeechCapture.js) and
    transcribes it with a fully local faster-whisper model - no API
    key, no network dependency. Returns None - not a fake transcript -
    if decoding fails or the audio contains no speech, so the caller
    (captions.handlers.js on the Node side) correctly treats this as
    "no caption available" rather than displaying a made-up result.
    """
    try:
        raw = DATA_URL_PATTERN.sub("", audio_data)
        audio_bytes = base64.b64decode(raw)
        if not audio_bytes:
            return None

        # faster-whisper decodes compressed formats (webm/ogg/etc) via
        # PyAV internally, so a raw BytesIO of the original chunk works
        # the same way the OpenAI SDK's file-like input did before.
        audio_file = io.BytesIO(audio_bytes)

        model = _get_model()
        segments, _info = model.transcribe(
            audio_file,
            beam_size=1,       # fast, greedy-ish decoding - good enough for live captions
            vad_filter=True,   # skips silent stretches instead of transcribing them
        )

        text = " ".join(segment.text.strip() for segment in segments).strip()
        return text or None
    except Exception as err:
        print(f"[whisper_service] transcription failed: {err}")
        return None