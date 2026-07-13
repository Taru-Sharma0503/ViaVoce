"""
Sign classification abstraction.

IMPORTANT (per project constraints): this module does NOT train or ship
a real sign-language recognition model - that's a research-scale problem
out of scope for a hackathon build. Instead it defines a stable interface
(`SignModelWrapper.predict`) and a rule-based DEMO classifier behind it,
so the rest of the system (FastAPI route, Node server, React client) can
be built and demoed against a believable pipeline today.

To plug in a real trained model later:
  1. Implement a class with a `.predict(landmarks: FrameLandmarks) -> (label, confidence)`
     method (see `PretrainedSignModel` below for the expected shape).
  2. Point `SIGN_MODEL_PATH` at its weights/checkpoint file.
  3. Nothing else in the codebase needs to change - the router, the
     confidence threshold, and the client all consume the same contract.
"""

import os
from typing import Optional

from app.services.mediapipe_pipeline import FrameLandmarks, HandLandmarks

# Curated demo vocabulary - a deliberately small, distinguishable set
# (per the architecture blueprint's "convincing demo, not solved
# research problem" scope), built from geometric heuristics over hand
# landmarks. These are schematic gestures for demo clarity, not a
# claim of authentic ASL/ISL correctness.
DEMO_VOCABULARY = [
    "HELLO",
    "THANK YOU",
    "PLEASE",
    "YES",
    "NO",
    "HELP",
    "FOOD",
    "WATER",
    "SCHOOL",
    "DOCTOR",  # reserved: not reachable by the current single-frame geometric
    # heuristic below - real ASL "doctor" involves a tap/motion gesture that
    # needs landmark data across frames, not a single static pose. Listed
    # here as a placeholder for when a pretrained/temporal model is plugged in.
    "EMERGENCY",
    "NEED ASSISTANCE",
]


class SignModelWrapper:
    """
    The single entry point the rest of the service uses for sign
    classification. Internally delegates to either a real pretrained
    model (if `SIGN_MODEL_PATH` is set and loadable) or the built-in
    rule-based demo classifier.
    """

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or os.getenv("SIGN_MODEL_PATH")
        self._pretrained_model = self._try_load_pretrained(self.model_path)

    def _try_load_pretrained(self, model_path: Optional[str]):
        if not model_path or not os.path.exists(model_path):
            return None
        try:
            # Placeholder load path for a real model artifact (e.g. a
            # scikit-learn/PyTorch/TFLite checkpoint trained on landmark
            # sequences). Left unimplemented on purpose - wire up the
            # actual loading code for whatever model format is chosen
            # once a real trained model exists.
            print(f"[sign_model] SIGN_MODEL_PATH is set ({model_path}) but no loader is "
                  f"implemented yet - falling back to the demo classifier.")
            return None
        except Exception as err:
            print(f"[sign_model] failed to load pretrained model: {err}")
            return None

    def predict(self, landmarks: FrameLandmarks) -> tuple[Optional[str], float]:
        """
        Returns (label, confidence). label is None if no sign could be
        confidently recognized in this frame (e.g. no hands visible).
        """
        if self._pretrained_model is not None:
            return self._pretrained_model.predict(landmarks)
        return _demo_predict(landmarks)


# --- Demo classifier (rule-based, no training) ---------------------------


def _count_extended_fingers(hand: HandLandmarks) -> tuple[int, bool]:
    """
    Standard landmark-geometry heuristic: a non-thumb finger is
    "extended" if its tip is above (smaller y, in normalized image
    coordinates) its PIP joint. The thumb is checked separately via
    distance from the palm, since its extension axis is different.
    Returns (extended_count_excluding_thumb, thumb_extended).
    """
    if not hand.present:
        return 0, False

    p = hand.points
    tips = {"index": 8, "middle": 12, "ring": 16, "pinky": 20}
    pips = {"index": 6, "middle": 10, "ring": 14, "pinky": 18}

    extended = sum(1 for f in tips if p[tips[f]][1] < p[pips[f]][1])

    # Thumb: compare distance of tip (4) from pinky MCP (17) against
    # distance of thumb MCP (2) from pinky MCP - if the tip is
    # further out, the thumb is extended away from the palm.
    def dist(a, b):
        return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5

    thumb_extended = dist(p[4], p[17]) > dist(p[2], p[17]) * 1.3

    return extended, thumb_extended


def _hand_vertical_zone(hand: HandLandmarks, pose: list[tuple[float, float, float]]) -> str:
    """Classifies a hand's height as 'face', 'chest', or 'unknown' relative to pose landmarks."""
    if not hand.present or not pose or len(pose) < 13:
        return "unknown"

    wrist_y = hand.points[0][1]
    nose_y = pose[0][1]
    shoulder_y = (pose[11][1] + pose[12][1]) / 2

    if wrist_y < (nose_y + shoulder_y) / 2:
        return "face"
    return "chest"


def _demo_predict(landmarks: FrameLandmarks) -> tuple[Optional[str], float]:
    left, right = landmarks.left_hand, landmarks.right_hand
    hands_present = [h for h in (left, right) if h.present]

    if len(hands_present) == 0:
        return None, 0.0

    if len(hands_present) == 2:
        left_fingers, left_thumb = _count_extended_fingers(left)
        right_fingers, right_thumb = _count_extended_fingers(right)
        left_open = left_fingers >= 4
        right_open = right_fingers >= 4
        left_fist = left_fingers == 0
        right_fist = right_fingers == 0

        if left_fist and right_fist:
            return "EMERGENCY", 0.7
        if left_open and right_open:
            return "PLEASE", 0.6
        if (left_open and right_fist) or (right_open and left_fist):
            return "WATER", 0.55
        return None, 0.0

    # Single hand
    hand = hands_present[0]
    fingers, thumb_extended = _count_extended_fingers(hand)
    zone = _hand_vertical_zone(hand, landmarks.pose)

    if fingers == 0 and not thumb_extended:
        return "NO", 0.6
    if fingers == 0 and thumb_extended:
        return "YES", 0.65
    if fingers == 1:
        return "HELP", 0.65
    if fingers == 2:
        return "FOOD", 0.55
    if fingers == 3:
        return "SCHOOL", 0.55
    if fingers == 4 and thumb_extended:
        # Open palm, all five extended - face-height reads as a greeting,
        # chest-height reads as a thank-you gesture.
        return ("HELLO", 0.7) if zone == "face" else ("THANK YOU", 0.65)
    if fingers == 4:
        return "NEED ASSISTANCE", 0.55

    return None, 0.0


# Module-level singleton - loaded once at import time, reused across requests.
sign_model = SignModelWrapper()
