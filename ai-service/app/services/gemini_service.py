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
    Returns (sentence, generated_by). generated_by is "gemini" if the
    live Gemini API produced the result, "ollama" if a local Llama 3
    model produced it after Gemini was unavailable/unconfigured, or
    "fallback" if neither worked - callers/UI can surface this for
    transparency during a demo rather than silently guessing.
    """
    if not gloss_sequence:
        return None, "fallback"

    prompt = PROMPT_TEMPLATE.format(glosses=", ".join(gloss_sequence))

    if settings.GEMINI_API_KEY:
        sentence = _try_gemini(prompt)
        if sentence:
            return sentence, "gemini"

    if settings.OLLAMA_BASE_URL:
        sentence = _try_ollama(prompt)
        if sentence:
            return sentence, "ollama"

    return _fallback_sentence(gloss_sequence), "fallback"


def _try_gemini(prompt: str) -> Optional[str]:
    try:
        response = httpx.post(
            GEMINI_URL,
            params={"key": settings.GEMINI_API_KEY},
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=10.0,
        )
        response.raise_for_status()
        data = response.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        return text or None
    except Exception as err:
        print(f"[gemini_service] Gemini request failed, trying Ollama fallback: {err}")
        return None


def _try_ollama(prompt: str) -> Optional[str]:
    try:
        response = httpx.post(
            f"{settings.OLLAMA_BASE_URL}/api/generate",
            json={"model": settings.OLLAMA_MODEL, "prompt": prompt, "stream": False},
            timeout=20.0,  # local generation is slower than a hosted API on CPU
        )
        response.raise_for_status()
        data = response.json()
        text = (data.get("response") or "").strip()
        return text or None
    except Exception as err:
        print(f"[gemini_service] Ollama request failed, using deterministic fallback: {err}")
        return None


def _fallback_sentence(gloss_sequence: list[str]) -> str:
    """
    Simple deterministic template used when neither Gemini nor Ollama
    are available, so the pipeline still produces something useful
    rather than going silent. Not a claim of NLG quality - just a
    readable join of the recognized signs.
    """
    words = [g.strip().lower() for g in gloss_sequence if g.strip()]
    if not words:
        return ""
    if len(words) == 1:
        return words[0].capitalize() + "."
    return (", ".join(words[:-1]) + " " + words[-1]).capitalize() + "."