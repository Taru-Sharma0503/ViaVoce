import base64
import re
from dataclasses import dataclass, field
from typing import Optional

import cv2
import numpy as np
import mediapipe as mp

mp_holistic = mp.solutions.holistic

# One shared Holistic instance, reused across requests. MediaPipe's
# Python solutions aren't designed for concurrent multi-threaded calls
# on a single instance - fine for a hackathon demo's request volume,
# but a production build would pool instances per-worker or move to
# MediaPipe Tasks API, which is thread-safe.
_holistic = mp_holistic.Holistic(
    static_image_mode=True,  # each call is treated as an independent image, not a video stream
    model_complexity=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)

DATA_URL_PATTERN = re.compile(r"^data:.*;base64,")


@dataclass
class HandLandmarks:
    points: list[tuple[float, float, float]] = field(default_factory=list)  # (x, y, z), normalized

    @property
    def present(self) -> bool:
        return len(self.points) == 21


@dataclass
class FrameLandmarks:
    left_hand: HandLandmarks
    right_hand: HandLandmarks
    pose: list[tuple[float, float, float]] = field(default_factory=list)  # 33 pose landmarks

    @property
    def hands_detected(self) -> int:
        return int(self.left_hand.present) + int(self.right_hand.present)


def decode_base64_image(frame_data: str) -> Optional[np.ndarray]:
    """
    Decodes a base64 (optionally data-URL-prefixed) JPEG/PNG string into
    a BGR numpy array as OpenCV expects. Returns None if decoding fails
    rather than raising - a single malformed frame shouldn't crash the
    stream of frame:capture events coming from the client.
    """
    try:
        raw = DATA_URL_PATTERN.sub("", frame_data)
        img_bytes = base64.b64decode(raw)
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        return cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    except Exception:
        return None


def extract_landmarks(frame_data: str) -> Optional[FrameLandmarks]:
    """
    Runs MediaPipe Holistic on a single base64-encoded frame and
    returns normalized pose + hand landmarks. This is the only place
    in the service that touches MediaPipe directly - sign_model_wrapper
    consumes its output without knowing anything about MediaPipe.
    """
    image = decode_base64_image(frame_data)
    if image is None:
        return None

    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = _holistic.process(image_rgb)

    left_hand = HandLandmarks(
        points=[(lm.x, lm.y, lm.z) for lm in results.left_hand_landmarks.landmark]
        if results.left_hand_landmarks
        else []
    )
    right_hand = HandLandmarks(
        points=[(lm.x, lm.y, lm.z) for lm in results.right_hand_landmarks.landmark]
        if results.right_hand_landmarks
        else []
    )
    pose = (
        [(lm.x, lm.y, lm.z) for lm in results.pose_landmarks.landmark]
        if results.pose_landmarks
        else []
    )

    return FrameLandmarks(left_hand=left_hand, right_hand=right_hand, pose=pose)
