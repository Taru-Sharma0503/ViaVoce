from typing import Optional

import httpx

from app.config import settings

# Called via plain REST (not the google-generativeai SDK). The SDK wraps
# gRPC, which was found during testing to hard-crash the whole Python
# process on certain blocked/reset network conditions instead of raising
# a catchable exception - unacceptable for a request handler that must
# degrade gracefully. A plain HTTPS POST fails the normal, catchable way.
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-1.5-flash:generateContent"
)

PROMPT_TEMPLATE = """You are helping a hearing person understand what a deaf/sign-language \
user just communicated. You are given a short sequence of recognized signs, in the order \
they were signed. Turn them into ONE natural, grammatically correct English sentence a \
hearing person would understand, as if the signer had spoken it themselves.

Rules:
- Output ONLY the sentence, nothing else - no preamble, no quotes.
- Keep it concise and natural, not robotic.
- If the signs suggest urgency (e.g. EMERGENCY, HELP), reflect that urgency in tone.

Recognized signs, in order: {glosses}
Sentence:"""


def generate_sentence(gloss_sequence: list[str]) -> tuple[Optional[str], str]:
    """
    Returns (sentence, generated_by) where generated_by is "gemini" if
    the live API produced the result, or "fallback" if Gemini wasn't
    configured or the call failed - callers/UI can surface this for
    transparency during a demo rather than silently guessing.
    """
    if not gloss_sequence:
        return None, "fallback"

    if settings.GEMINI_API_KEY:
        try:
            prompt = PROMPT_TEMPLATE.format(glosses=", ".join(gloss_sequence))
            response = httpx.post(
                GEMINI_URL,
                params={"key": settings.GEMINI_API_KEY},
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=10.0,
            )
            response.raise_for_status()
            data = response.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            if text:
                return text, "gemini"
        except Exception as err:
            print(f"[gemini_service] request failed, using fallback: {err}")

    return _fallback_sentence(gloss_sequence), "fallback"


def _fallback_sentence(gloss_sequence: list[str]) -> str:
    """
    Simple deterministic template used when Gemini isn't configured or
    is unreachable, so the pipeline still produces something useful
    rather than going silent. Not a claim of NLG quality - just a
    readable join of the recognized signs.
    """
    words = [g.strip().lower() for g in gloss_sequence if g.strip()]
    if not words:
        return ""
    if len(words) == 1:
        return words[0].capitalize() + "."
    return (", ".join(words[:-1]) + " " + words[-1]).capitalize() + "."
