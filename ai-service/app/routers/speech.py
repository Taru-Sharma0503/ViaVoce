from fastapi import APIRouter

from app.schemas import SynthesizeSpeechRequest, SynthesizeSpeechResponse
from app.services.tts_service import synthesize_speech

router = APIRouter()


@router.post("/synthesize-speech", response_model=SynthesizeSpeechResponse)
async def synthesize_speech_route(payload: SynthesizeSpeechRequest):
    """
    Synthesizes the given text to speech and returns a playable URL.
    audioUrl=None means synthesis wasn't available - the client's
    TranslationPanel already renders gracefully without a Play button
    in that case (see client/src/components/TranslationPanel.jsx).
    """
    audio_url = await synthesize_speech(payload.text, payload.voice or "warm")
    return SynthesizeSpeechResponse(audioUrl=audio_url)
