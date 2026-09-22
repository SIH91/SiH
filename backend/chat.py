"""Safe, user-facing chat behavior for the LocoBiz AI frontend."""
from __future__ import annotations

import json
import os
import re
from typing import Any

from .narrative import is_configured

GREETING_RE = re.compile(r"^\s*(hi|hello|hey|namaste|good\s+(morning|afternoon|evening))\s*[!.?]*\s*$", re.I)
CHAT_SCHEMA = {
    "type": "json_schema",
    "name": "locobiz_chat_reply",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {"reply": {"type": "string"}},
        "required": ["reply"],
        "additionalProperties": False,
    },
}
DISCLAIMER = "Advice is AI-assisted. Verify financing and scheme eligibility with the relevant authority."


def _fallback(message: str) -> dict[str, Any]:
    if GREETING_RE.match(message):
        return {
            "reply": "Namaste! I am LocoBiz AI, your rural business planning guide. Tell me your business idea, village or town, and estimated investment, and I will help you start an evaluation.",
            "intent": "greeting",
            "generated_with_ai": False,
            "disclaimer": None,
        }
    return {
        "reply": "I can help you assess a rural business idea, plan costs, identify risks, and prepare DPR inputs. Please share your business type, location, and estimated investment. I will clearly label estimates and never guarantee a loan or scheme approval.",
        "intent": "needs_evaluation",
        "generated_with_ai": False,
        "disclaimer": DISCLAIMER,
    }


def reply(message: str, language: str) -> dict[str, Any]:
    """Return a safe reply; a greeting is never sent to the model."""
    fallback = _fallback(message)
    if fallback["intent"] == "greeting" or not is_configured():
        return fallback
    try:
        from openai import OpenAI

        response = OpenAI().responses.create(
            model=os.getenv("OPENAI_MODEL", "gpt-5"),
            instructions=(
                "You are LocoBiz AI, a rural enterprise planning assistant. Respond in the requested language. "
                "Do not invent government scheme percentages, eligibility, current market data, or loan terms. "
                "Do not promise success or approval. Ask for business type, location, and investment when missing. "
                "State that unverified factual claims must be checked with an authority. Keep the reply under 100 words."
            ),
            input=json.dumps({"language": language, "user_message": message}),
            text={"format": CHAT_SCHEMA},
            max_output_tokens=250,
            store=False,
        )
        result = json.loads(response.output_text)
        return {"reply": result["reply"], "intent": "business_question", "generated_with_ai": True, "disclaimer": DISCLAIMER}
    except Exception:
        return fallback
