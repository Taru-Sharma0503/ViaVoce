import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers import health, frame, audio, sentence, speech

app = FastAPI(
    title="ViaVoce AI Service",
    description="MediaPipe landmark extraction, sign recognition, Gemini "
    "sentence generation, Whisper transcription, and TTS synthesis.",
    version="0.1.0",
)

# Only the Node.js backend should call this service - not the browser
# client directly - per the architecture rules. CORS is locked down
# accordingly rather than left open.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.ALLOWED_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(frame.router, tags=["sign-recognition"])
app.include_router(audio.router, tags=["speech-to-text"])
app.include_router(sentence.router, tags=["nlg"])
app.include_router(speech.router, tags=["tts"])

# Serves synthesized speech audio saved by tts_service.py. Hackathon-scope
# simplification - production would serve these from blob storage (S3/GCS)
# with signed URLs instead of local disk.
_static_audio_dir = os.path.join(os.path.dirname(__file__), "static", "audio")
os.makedirs(_static_audio_dir, exist_ok=True)
app.mount("/audio", StaticFiles(directory=_static_audio_dir), name="audio")


@app.on_event("startup")
def log_provider_status():
    # Visibility during demo setup - which AI providers are actually
    # live vs. running on fallback behavior.
    print(f"[startup] Gemini configured: {bool(settings.GEMINI_API_KEY)}")
    print("[startup] Whisper: Local Faster-Whisper")
    print("[startup] TTS: Local Piper")


@app.get("/")
def root():
    return {"service": "viavoce-ai-service", "status": "running"}
