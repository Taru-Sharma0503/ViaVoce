import asyncio
import os
import platform
import shutil
import uuid
from typing import Optional

from app.config import settings

STATIC_AUDIO_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "audio")
os.makedirs(STATIC_AUDIO_DIR, exist_ok=True)

# Maps the client's TTSControls voice preference to a local Piper voice
# model file (.onnx) living in settings.PIPER_VOICES_DIR. Swap the
# filenames here to change which downloaded voice backs each option -
# see the install notes for how to fetch voice files. Piper expects a
# matching "<filename>.json" config file to sit alongside each .onnx
# file in the same directory.
VOICE_MAP = {
    "warm": "en_US-lessac-medium.onnx",
    "clear": "en_US-amy-medium.onnx",
    "calm": "en_US-ljspeech-medium.onnx",
}
DEFAULT_VOICE = "warm"

# Path to the piper CLI binary (piper.exe on Windows, piper elsewhere).
# We shell out to the compiled binary rather than importing the
# `piper-tts` Python package: piper-tts pulls in piper-phonemize, which
# has no prebuilt wheel for Windows/Python 3.11 and fails to build from
# source there. The CLI binary has no such dependency - download the
# matching release for your platform and point PIPER_EXE_PATH at it
# (or place it on PATH under the default name).
_DEFAULT_EXE_NAME = "piper.exe" if platform.system() == "Windows" else "piper"
PIPER_EXE_PATH = os.getenv("PIPER_EXE_PATH", _DEFAULT_EXE_NAME)


def _resolve_piper_exe() -> Optional[str]:
    """
    Resolves the piper binary to an executable path: either a direct
    path (if PIPER_EXE_PATH points at a real file) or something found
    on PATH. Returns None if it can't be found, so callers can fail
    gracefully instead of crashing the request handler.
    """
    if os.path.isfile(PIPER_EXE_PATH) and os.access(PIPER_EXE_PATH, os.X_OK):
        return PIPER_EXE_PATH

    found = shutil.which(PIPER_EXE_PATH)
    if found:
        return found

    print(
        f"[tts_service] piper executable not found at '{PIPER_EXE_PATH}' or on PATH - "
        f"set PIPER_EXE_PATH to the downloaded piper binary. Skipping speech synthesis."
    )
    return None


def _resolve_voice_model(voice: str) -> Optional[str]:
    model_filename = VOICE_MAP.get(voice, VOICE_MAP[DEFAULT_VOICE])
    model_path = os.path.join(settings.PIPER_VOICES_DIR, model_filename)

    if not os.path.exists(model_path):
        print(
            f"[tts_service] Piper voice model not found at {model_path} - "
            f"see install notes to download it. Skipping speech synthesis."
        )
        return None

    return model_path


async def synthesize_speech(text: str, voice: str = DEFAULT_VOICE) -> Optional[str]:
    """
    Synthesizes `text` to speech by shelling out to the local piper CLI
    binary and returns a URL path the client can play directly (served
    by FastAPI's StaticFiles mount at /audio - see main.py). Returns
    None if the piper binary or the requested voice model isn't
    available, or if synthesis fails; the server already treats a null
    audioUrl as "no audio for this translation" rather than erroring.

    In production this would still want to move off local disk to
    blob storage (S3/GCS) - that simplification is unrelated to this
    migration and was already true before.
    """
    if not text.strip():
        return None

    piper_exe = _resolve_piper_exe()
    if piper_exe is None:
        return None

    model_path = _resolve_voice_model(voice)
    if model_path is None:
        return None

    filename = f"{uuid.uuid4().hex}.wav"
    filepath = os.path.join(STATIC_AUDIO_DIR, filename)

    try:
        await _run_piper(piper_exe, model_path, text, filepath)
    except Exception as err:
        print(f"[tts_service] Piper synthesis failed: {err}")
        return None

    if not os.path.exists(filepath):
        print("[tts_service] Piper exited without producing an output file")
        return None

    return f"/audio/{filename}"


async def _run_piper(piper_exe: str, model_path: str, text: str, output_path: str) -> None:
    """
    Runs `piper --model <model_path> --output_file <output_path>`,
    piping `text` in on stdin - the CLI's standard invocation. Fully
    async via asyncio's subprocess API so it doesn't block the FastAPI
    event loop while other requests (frame processing, captions) are live.
    """
    process = await asyncio.create_subprocess_exec(
        piper_exe,
        "--model",
        model_path,
        "--output_file",
        output_path,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    _stdout, stderr = await process.communicate(input=text.encode("utf-8"))

    if process.returncode != 0:
        stderr_text = stderr.decode("utf-8", errors="replace").strip()
        raise RuntimeError(
            f"piper exited with code {process.returncode}: {stderr_text or '(no stderr output)'}"
        )