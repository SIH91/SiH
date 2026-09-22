from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field, model_validator


class EntrepreneurProfile(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    location: str = Field(min_length=2, max_length=180)
    experience_years: float = Field(ge=0, le=80)
    entrepreneur_type: Literal["farmer", "individual", "self_help_group", "fpo", "other"]
    business_stage: Literal["new", "existing"]


class BusinessPlan(BaseModel):
    category: str = Field(min_length=2, max_length=80)
    archetype: str = Field(min_length=2, max_length=100)
    project_name: str = Field(min_length=2, max_length=160)
    description: str = Field(min_length=20, max_length=3000)
    competitors: int = Field(default=0, ge=0, le=1000)
    local_demand: Literal["low", "moderate", "high"]
    transport_access: Literal["limited", "adequate", "strong"]


class FinancialInputs(BaseModel):
    total_project_cost: float = Field(gt=0)
    entrepreneur_contribution: float = Field(ge=0)
    fixed_assets: float = Field(ge=0)
    equipment_machinery: float = Field(ge=0)
    working_capital: float = Field(ge=0)
    other_expenses: float = Field(default=0, ge=0)
    expected_annual_revenue: float | None = Field(default=None, ge=0)
    expected_annual_expenses: float | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def contribution_must_not_exceed_cost(self) -> "FinancialInputs":
        if self.entrepreneur_contribution > self.total_project_cost:
            raise ValueError("entrepreneur_contribution cannot exceed total_project_cost")
        return self


class EvaluationRequest(BaseModel):
    entrepreneur: EntrepreneurProfile
    business: BusinessPlan
    financials: FinancialInputs
    language: str = Field(default="en", pattern=r"^[a-z]{2}(-[A-Z]{2})?$")


class FactorScore(BaseModel):
    score: int = Field(ge=0, le=100)
    explanation: str


class EvaluationResponse(BaseModel):
    feasibility_score: int = Field(ge=0, le=100)
    potential: Literal["high", "moderate", "low"]
    factor_scores: dict[str, FactorScore]
    financial_plan: dict
    market_insights: list[str]
    risk_flags: list[str]
    scheme_matches: list[dict]
    dpr: dict
    assumptions: list[dict]
    disclaimer: str
    audit_trail: list[dict]
    generated_with_ai: bool
    ai_insights: dict | None = None


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1200)
    language: str = Field(default="en", pattern=r"^[a-z]{2}(-[A-Z]{2})?$")


class ChatResponse(BaseModel):
    reply: str
    intent: Literal["greeting", "business_question", "needs_evaluation"]
    generated_with_ai: bool
    disclaimer: str | None = None
