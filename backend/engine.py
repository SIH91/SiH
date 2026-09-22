"""Explainable, deterministic evaluation engine for the GramBiz MVP."""
from __future__ import annotations

from datetime import datetime, timezone
from math import floor
from typing import Any

from .schemas import EvaluationRequest

DEFAULT_MARGINS = {
    "dairy": 0.18,
    "agriculture": 0.16,
    "food processing": 0.20,
    "retail": 0.12,
    "manufacturing": 0.15,
}


def _clamp(value: float) -> int:
    return max(0, min(100, floor(value)))


def _margin_for(category: str) -> float:
    normalized = category.strip().lower()
    return next((margin for key, margin in DEFAULT_MARGINS.items() if key in normalized), 0.14)


def _potential(score: int) -> str:
    if score >= 75:
        return "high"
    if score >= 50:
        return "moderate"
    return "low"


def _scheme_matches(data: EvaluationRequest, financing_needed: float) -> list[dict[str, Any]]:
    category = data.business.category.lower()
    matches: list[dict[str, Any]] = []
    if any(word in category for word in ("agri", "dairy", "food", "farm")):
        matches.append({
            "name": "Agriculture Infrastructure Fund (AIF)",
            "why_matched": "The project is agriculture-linked and requires capital investment.",
            "verification_required": True,
        })
    if data.entrepreneur.entrepreneur_type in {"individual", "self_help_group", "farmer"}:
        matches.append({
            "name": "Pradhan Mantri MUDRA Yojana (PMMY)",
            "why_matched": "The entrepreneur profile and financing need may suit a micro-enterprise loan.",
            "verification_required": True,
        })
    if financing_needed >= 1_000_000:
        matches.append({
            "name": "Stand-Up India (screening match)",
            "why_matched": "The capital requirement warrants checking enterprise-loan options.",
            "verification_required": True,
        })
    return matches


def evaluate(data: EvaluationRequest) -> dict[str, Any]:
    business, financials, entrepreneur = data.business, data.financials, data.entrepreneur
    demand_base = {"low": 42, "moderate": 65, "high": 84}[business.local_demand]
    access_bonus = {"limited": 0, "adequate": 6, "strong": 11}[business.transport_access]
    demand = _clamp(demand_base + access_bonus)

    contribution_ratio = financials.entrepreneur_contribution / financials.total_project_cost
    capital = _clamp(45 + contribution_ratio * 105)

    assumed_margin = _margin_for(business.category)
    estimated_revenue = financials.expected_annual_revenue or financials.total_project_cost * (1.3 + assumed_margin)
    estimated_expenses = financials.expected_annual_expenses or estimated_revenue * (1 - assumed_margin)
    projected_profit = estimated_revenue - estimated_expenses
    margin = projected_profit / estimated_revenue if estimated_revenue else 0
    profitability = _clamp(38 + margin * 240)

    risk = _clamp(45 + min(entrepreneur.experience_years, 10) * 3 + (10 if entrepreneur.business_stage == "existing" else 0) + (5 if business.transport_access != "limited" else 0))
    competition = _clamp(88 - min(business.competitors, 20) * 2.5)
    factors = {
        "demand": {"score": demand, "explanation": f"Local demand is marked {business.local_demand}; transport access is {business.transport_access}."},
        "capital": {"score": capital, "explanation": f"Entrepreneur contribution covers {contribution_ratio:.0%} of project cost."},
        "profitability": {"score": profitability, "explanation": f"Projected operating margin is {margin:.1%}."},
        "risk": {"score": risk, "explanation": f"Based on {entrepreneur.experience_years:g} years of experience and {entrepreneur.business_stage} business stage."},
        "competition": {"score": competition, "explanation": f"The evaluation records {business.competitors} known local competitors."},
    }
    score = _clamp(sum(factors[key]["score"] * weight for key, weight in {
        "demand": 0.25, "capital": 0.20, "profitability": 0.25, "risk": 0.15, "competition": 0.15,
    }.items()))
    financing_needed = financials.total_project_cost - financials.entrepreneur_contribution
    risk_flags = []
    if contribution_ratio < 0.2:
        risk_flags.append("Low promoter contribution may increase financing risk.")
    if business.competitors >= 8:
        risk_flags.append("High stated competition requires a clearer differentiation strategy.")
    if business.transport_access == "limited":
        risk_flags.append("Limited transport access may affect supply cost and market reach.")
    if not risk_flags:
        risk_flags.append("No critical rule-based risk flag was detected; verify field data before financing decisions.")

    assumptions = [
        {"field": "annual_revenue", "value": estimated_revenue, "source": "user" if financials.expected_annual_revenue is not None else "system_estimate", "note": "Estimate is based on project cost and category margin."},
        {"field": "annual_expenses", "value": estimated_expenses, "source": "user" if financials.expected_annual_expenses is not None else "system_estimate", "note": "Estimate is based on revenue and category margin."},
        {"field": "profit_margin", "value": margin, "source": "calculated", "note": "Revenue less annual expenses, divided by revenue."},
    ]
    market_insights = [
        f"{entrepreneur.location} is evaluated using user-provided demand and accessibility indicators.",
        f"{business.competitors} competitor(s) were entered; validate this through local field research.",
        "Live mandi, population, and geospatial feeds are not connected in this MVP response.",
    ]
    dpr = {
        "executive_summary": f"{business.project_name} is a {business.category} proposal in {entrepreneur.location} with an AI-assisted feasibility score of {score}/100.",
        "project_cost": financials.total_project_cost,
        "funding_requirement": financing_needed,
        "projected_annual_revenue": estimated_revenue,
        "projected_annual_expenses": estimated_expenses,
        "projected_annual_profit": projected_profit,
        "recommendations": ["Review all system estimates before producing a lender-facing DPR.", "Validate competitor, demand, and scheme data with authoritative local sources."] + risk_flags,
    }
    return {
        "feasibility_score": score,
        "potential": _potential(score),
        "factor_scores": factors,
        "financial_plan": {"project_cost": financials.total_project_cost, "entrepreneur_contribution": financials.entrepreneur_contribution, "financing_needed": financing_needed, "projected_annual_revenue": estimated_revenue, "projected_annual_expenses": estimated_expenses, "projected_annual_profit": projected_profit},
        "market_insights": market_insights,
        "risk_flags": risk_flags,
        "scheme_matches": _scheme_matches(data, financing_needed),
        "dpr": dpr,
        "assumptions": assumptions,
        "disclaimer": "This is an AI-assisted feasibility assessment, not a guarantee of business success, loan approval, or scheme eligibility. Verify all estimates and eligibility with authoritative sources.",
        "audit_trail": [{"at": datetime.now(timezone.utc).isoformat(), "event": "deterministic_feasibility_evaluation", "version": "mvp-1"}],
        "generated_with_ai": False,
    }
