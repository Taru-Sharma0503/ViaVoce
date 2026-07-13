from typing import Optional
from pydantic import BaseModel


class ProcessFrameRequest(BaseModel):
    frameData: str  # base64-encoded JPEG (data URL or raw base64)
    roomId: str


class ProcessFrameResponse(BaseModel):
    label: Optional[str] = None
    confidence: float = 0.0
    handsDetected: int = 0


class ProcessAudioRequest(BaseModel):
    audioData: str  # base64-encoded audio chunk (data URL or raw base64)
    roomId: str


class ProcessAudioResponse(BaseModel):
    text: Optional[str] = None


class GenerateSentenceRequest(BaseModel):
    glossSequence: list[str]


class GenerateSentenceResponse(BaseModel):
    sentence: Optional[str] = None
    generatedBy: str = "fallback"  # "gemini" | "fallback" - transparent about which path ran


class SynthesizeSpeechRequest(BaseModel):
    text: str
    voice: Optional[str] = "warm"


class SynthesizeSpeechResponse(BaseModel):
    audioUrl: Optional[str] = None
