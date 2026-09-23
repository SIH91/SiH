"""Server-side translation providers for LocoBiz's multilingual interface."""
from __future__ import annotations

import html
import os
from collections.abc import Sequence

import httpx

GOOGLE_TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2"
BHASHINI_PIPELINE_URL = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"


class TranslationUnavailable(RuntimeError):
    """Raised when the selected translation provider is not configured."""


def configured_provider() -> str | None:
    preferred = os.getenv("TRANSLATION_PROVIDER", "auto").lower()
    if preferred in {"auto", "google"} and os.getenv("GOOGLE_TRANSLATE_API_KEY"):
        return "google"
    if preferred in {"auto", "bhashini"} and os.getenv("BHASHINI_INFERENCE_API_KEY"):
        return "bhashini"
    return None


async def _google_translate(texts: Sequence[str], source: str, target: str) -> list[str]:
    timeout = httpx.Timeout(20.0, connect=4.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(
            GOOGLE_TRANSLATE_URL,
            params={"key": os.environ["GOOGLE_TRANSLATE_API_KEY"]},
            data=[("q", text) for text in texts] + [("source", source), ("target", target), ("format", "text")],
        )
        response.raise_for_status()
    translations = response.json().get("data", {}).get("translations", [])
    if len(translations) != len(texts):
        raise ValueError("Google Translate returned an incomplete result")
    return [html.unescape(item["translatedText"]) for item in translations]


async def _bhashini_translate(texts: Sequence[str], source: str, target: str) -> list[str]:
    payload = {
        "pipelineTasks": [{
            "taskType": "translation",
            "config": {
                "language": {"sourceLanguage": source, "targetLanguage": target},
                "serviceId": os.getenv("BHASHINI_TRANSLATION_SERVICE_ID", "ai4bharat/indictrans-v2-all-gpu--t4"),
            },
        }],
        "inputData": {"input": [{"source": text} for text in texts]},
    }
    timeout = httpx.Timeout(20.0, connect=4.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(
            BHASHINI_PIPELINE_URL,
            headers={"Authorization": os.environ["BHASHINI_INFERENCE_API_KEY"], "Content-Type": "application/json"},
            json=payload,
        )
        response.raise_for_status()
    outputs = response.json().get("pipelineResponse", [{}])[0].get("output", [])
    if len(outputs) != len(texts):
        raise ValueError("BHASHINI returned an incomplete result")
    return [item["target"] for item in outputs]


async def translate_texts(texts: Sequence[str], source: str, target: str) -> tuple[str, list[str]]:
    provider = configured_provider()
    if not provider:
        raise TranslationUnavailable("No translation provider is configured")
    if source == target:
        return provider, list(texts)
    if provider == "google":
        return provider, await _google_translate(texts, source, target)
    return provider, await _bhashini_translate(texts, source, target)
