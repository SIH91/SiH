"""Optional OpenAI narrative enrichment; scoring always remains deterministic."""
from __future__ import annotations

import json
import os
from typing import Any


NARRATIVE_SCHEMA = {
    "type": "json_schema",
    "name": "locobiz_business_insights",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {
            "overview": {"type": "string"},
            "feasibility": {"$ref": "#/$defs/module_insight"},
            "market": {"$ref": "#/$defs/module_insight"},
            "financials": {"$ref": "#/$defs/module_insight"},
            "risks": {"$ref": "#/$defs/module_insight"},
            "schemes": {"$ref": "#/$defs/module_insight"},
            "dpr": {"$ref": "#/$defs/module_insight"},
        },
        "required": ["overview", "feasibility", "market", "financials", "risks", "schemes", "dpr"],
        "additionalProperties": False,
        "$defs": {
            "module_insight": {
                "type": "object",
                "properties": {
                    "summary": {"type": "string"},
                    "recommendations": {"type": "array", "items": {"type": "string"}},
                    "data_status": {"type": "string", "enum": ["user_input", "system_estimate", "requires_verification"]},
                },
                "required": ["summary", "recommendations", "data_status"],
                "additionalProperties": False,
            }
        },
    },
}


def is_configured() -> bool:
    """Do not expose the key itself; only reveal whether AI is available."""
    return bool(os.getenv("OPENAI_API_KEY"))


def enrich(assessment: dict[str, Any], language: str) -> dict[str, Any] | None:
    """Return structured guidance for every LocoBiz module when configured.

    A malformed or unavailable model response is deliberately non-fatal: the
    deterministic assessment remains a complete MVP response.
    """
    if not is_configured():
        return None
    try:
        from openai import OpenAI

        instructions = (
            "You are LocoBiz AI, an assistant for rural business planning. Use clear, practical language. "
            "Create distinct guidance for feasibility, market, financials, risks, schemes, and DPR. "
            "Never invent current market facts, government scheme percentages, eligibility, loan terms, or sources. "
            "Never promise profitability, loan approval, or scheme eligibility. Mark unverified items requires_verification "
            "and system calculations system_estimate. The deterministic score and financial values are authoritative; do not recalculate them."
        )
        response = OpenAI().responses.create(
            model=os.getenv("OPENAI_MODEL", "gpt-5"),
            instructions=instructions,
            input=json.dumps({"language": language, "assessment": assessment}),
            text={"format": NARRATIVE_SCHEMA},
            max_output_tokens=1000,
            store=False,
        )
        result = json.loads(response.output_text)
        if not all(key in result for key in ("overview", "feasibility", "market", "financials", "risks", "schemes", "dpr")):
            return None
        return result
    except Exception:
        return None
