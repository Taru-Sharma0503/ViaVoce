from fastapi import APIRouter

from app.schemas import ProcessAudioRequest, ProcessAudioResponse
from app.services.whisper_service import transcribe_audio

router = APIRouter()


@router.post("/process-audio", response_model=ProcessAudioResponse)
def process_audio(payload: ProcessAudioRequest):
    """
    Transcribes a base64-encoded audio chunk via Whisper. Returns
    text=None if transcription isn't available (no API key, empty
    audio, or a failed call) - never fabricates a transcript.
    """
    text = transcribe_audio(payload.audioData)
    return ProcessAudioResponse(text=text)
