from fastapi import APIRouter

from app.schemas import ProcessFrameRequest, ProcessFrameResponse
from app.services.mediapipe_pipeline import extract_landmarks
from app.services.sign_model_wrapper import sign_model

router = APIRouter()


@router.post("/process-frame", response_model=ProcessFrameResponse)
def process_frame(payload: ProcessFrameRequest):
    """
    Extracts hand/pose landmarks from a single camera frame and runs
    sign classification. Returns label=None when no confident sign is
    detected (e.g. no hands in frame) - the Node server treats that as
    "nothing to report" rather than an error (see
    server/src/sockets/translation.handlers.js).
    """
    landmarks = extract_landmarks(payload.frameData)

    if landmarks is None:
        return ProcessFrameResponse(label=None, confidence=0.0, handsDetected=0)

    label, confidence = sign_model.predict(landmarks)

    return ProcessFrameResponse(
        label=label,
        confidence=confidence,
        handsDetected=landmarks.hands_detected,
    )
