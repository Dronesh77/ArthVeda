from __future__ import annotations

from google import genai

from .settings import settings


class GeminiNotConfiguredError(RuntimeError):
    pass


def _ensure_configured() -> str:
    if not settings.gemini_api_key:
        raise GeminiNotConfiguredError(
            "GEMINI_API_KEY is not set. Create backend/.env with GEMINI_API_KEY=..."
        )
    return settings.gemini_api_key


def _client():
    api_key = _ensure_configured()
    return genai.Client(api_key=api_key)


def generate_text(*, system: str, user: str) -> str:
    """
    Minimal text generation wrapper for the prototype.
    """
    client = _client()
    resp = client.models.generate_content(
        model=settings.gemini_model,
        contents=user,
        config={
            "system_instruction": system,
        },
    )
    text = getattr(resp, "text", None)
    return (text or "").strip() or "I couldn't generate a response for that request."


def list_models() -> list[str]:
    """
    Return a list of model names available to this API key.
    """
    client = _client()
    models = client.models.list()
    out: list[str] = []
    for m in models:
        name = getattr(m, "name", None)
        if isinstance(name, str) and name:
            out.append(name)
    return sorted(set(out))

