from fastapi import APIRouter

from app.schemas import GenerateSentenceRequest, GenerateSentenceResponse
from app.services.gemini_service import generate_sentence

router = APIRouter()


@router.post("/generate-sentence", response_model=GenerateSentenceResponse)
def generate_sentence_route(payload: GenerateSentenceRequest):
    """
    Turns a buffered gloss sequence (e.g. ["HELP", "WATER"]) into a
    natural sentence via Gemini, falling back to a simple deterministic
    template if Gemini isn't configured or fails. `generatedBy` tells
    the caller which path actually ran, for demo transparency.
    """
    sentence, generated_by = generate_sentence(payload.glossSequence)
    return GenerateSentenceResponse(sentence=sentence, generatedBy=generated_by)
