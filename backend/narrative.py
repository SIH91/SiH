"""Optional OpenAI narrative enrichment; scoring always remains deterministic."""
from __future__ import annotations

import json
import os
from typing import Any


NARRATIVE_SCHEMA = {
    "type": "json_schema",
    "name": "grambiz_business_insights",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {
            "summary": {"type": "string"},
            "opportunities": {"type": "array", "items": {"type": "string"}},
            "cautions": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["summary", "opportunities", "cautions"],
        "additionalProperties": False,
    },
}


def is_configured() -> bool:
    """Do not expose the key itself; only reveal whether AI is available."""
    return bool(os.getenv("OPENAI_API_KEY"))


def enrich(assessment: dict[str, Any], language: str) -> dict[str, Any] | None:
    """Return concise, guarded recommendations when a server-side key is configured.

    A malformed or unavailable model response is deliberately non-fatal: the
    deterministic assessment remains a complete MVP response.
    """
    if not is_configured():
        return None
    try:
        from openai import OpenAI

        instructions = (
            "You are GramBiz AI, an assistant for rural business planning. "
            "Use clear, practical language. Never promise profitability, loan approval, "
            "or scheme eligibility. Call system estimates estimates, never verified facts. "
            "The deterministic score is authoritative and must not be recalculated."
        )
        response = OpenAI().responses.create(
            model=os.getenv("OPENAI_MODEL", "gpt-5"),
            instructions=instructions,
            input=json.dumps({"language": language, "assessment": assessment}),
            text={"format": NARRATIVE_SCHEMA},
            max_output_tokens=500,
            store=False,
        )
        result = json.loads(response.output_text)
        if not all(key in result for key in ("summary", "opportunities", "cautions")):
            return None
        return result
    except Exception:
        return None
