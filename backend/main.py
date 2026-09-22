import os

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .chat import reply
from .engine import evaluate
from .locations import search_locations
from .narrative import enrich, is_configured
from .schemas import ChatRequest, ChatResponse, EvaluationRequest, EvaluationResponse, LocationSearchResponse

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


@app.get("/api/v1/locations/search", response_model=LocationSearchResponse)
async def location_search(
    q: str = Query(min_length=2, max_length=100, description="Place name or postcode"),
    country_code: str = Query(default="IN", min_length=2, max_length=2),
    language: str = Query(default="en", pattern=r"^[a-z]{2}$"),
) -> dict:
    """Return place suggestions for location fields; India is the default scope."""
    query = q.strip()
    if len(query) < 2:
        raise HTTPException(status_code=422, detail="q must contain at least two non-space characters")
    if not country_code.isalpha():
        raise HTTPException(status_code=422, detail="country_code must be a two-letter ISO country code")
    try:
        results = await search_locations(query, country_code, language)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Location search is temporarily unavailable. Enter the location manually and try again.") from exc
    return {"results": results, "provider": "open_meteo_geocoding", "attribution": "Location data based on GeoNames via Open-Meteo."}


@app.post("/api/v1/evaluations/analyze", response_model=EvaluationResponse)
def analyze_evaluation(request: EvaluationRequest) -> dict:
    """Return an auditable feasibility assessment and DPR-ready data."""
    assessment = evaluate(request)
    insights = enrich(assessment, request.language)
    if insights:
        assessment["ai_insights"] = insights
        assessment["generated_with_ai"] = True
        assessment["audit_trail"].append({"event": "openai_module_insights", "modules": ["feasibility", "market", "financials", "risks", "schemes", "dpr"], "version": "mvp-1"})
    return assessment
