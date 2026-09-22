import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .chat import reply
from .engine import evaluate
from .narrative import enrich, is_configured
from .schemas import ChatRequest, ChatResponse, EvaluationRequest, EvaluationResponse

app = FastAPI(title="LocoBiz AI API", version="0.1.0")
allowed_origins = [origin.strip() for origin in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health() -> dict[str, bool | str]:
    return {"status": "ok", "openai_configured": is_configured()}


@app.get("/api/v1/ai/status")
def ai_status() -> dict[str, bool | str]:
    return {
        "configured": is_configured(),
        "mode": "openai_responses" if is_configured() else "deterministic_only",
    }


@app.post("/api/v1/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> dict:
    """Safe chat endpoint for the LocoBiz interface."""
    return reply(request.message, request.language)


@app.post("/api/v1/evaluations/analyze", response_model=EvaluationResponse)
def analyze_evaluation(request: EvaluationRequest) -> dict:
    """Return an auditable feasibility assessment and DPR-ready data."""
    assessment = evaluate(request)
    insights = enrich(assessment, request.language)
    if insights:
        assessment["ai_insights"] = insights
        assessment["generated_with_ai"] = True
        assessment["audit_trail"].append({"event": "openai_narrative_enrichment", "version": "mvp-1"})
    return assessment
