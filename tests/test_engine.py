import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from backend.engine import evaluate
from backend.chat import reply
from backend.narrative import enrich, is_configured
from backend.schemas import EvaluationRequest


class EvaluationEngineTests(unittest.TestCase):
    def test_ai_is_disabled_without_a_server_key(self):
        with patch.dict("os.environ", {}, clear=True):
            self.assertFalse(is_configured())

    def test_greeting_is_neutral_and_never_makes_scheme_claims(self):
        response = reply("hey", "en")
        self.assertEqual(response["intent"], "greeting")
        self.assertIn("LocoBiz", response["reply"])
        self.assertNotIn("90%", response["reply"])
        self.assertFalse(response["generated_with_ai"])

    def test_openai_enrichment_requests_strict_json_without_storing(self):
        fake_response = SimpleNamespace(output_text='{"summary":"Useful plan.","opportunities":["Local demand"],"cautions":["Verify estimates"]}')
        create = MagicMock(return_value=fake_response)
        fake_client = SimpleNamespace(responses=SimpleNamespace(create=create))
        with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}, clear=True), patch("openai.OpenAI", return_value=fake_client):
            result = enrich({"feasibility_score": 72}, "en")
        self.assertEqual(result["summary"], "Useful plan.")
        self.assertFalse(create.call_args.kwargs["store"])
        self.assertEqual(create.call_args.kwargs["text"]["format"]["type"], "json_schema")

    def test_returns_explainable_bounded_score(self):
        request = EvaluationRequest.model_validate({
            "entrepreneur": {"name": "Asha", "location": "Nashik, Maharashtra", "experience_years": 4, "entrepreneur_type": "farmer", "business_stage": "new"},
            "business": {"category": "Dairy", "archetype": "Milk collection", "project_name": "Asha Dairy", "description": "A village dairy collection and chilled milk aggregation business.", "competitors": 2, "local_demand": "high", "transport_access": "adequate"},
            "financials": {"total_project_cost": 800000, "entrepreneur_contribution": 240000, "fixed_assets": 300000, "equipment_machinery": 250000, "working_capital": 200000, "other_expenses": 50000},
        })
        result = evaluate(request)
        self.assertGreaterEqual(result["feasibility_score"], 0)
        self.assertLessEqual(result["feasibility_score"], 100)
        self.assertEqual(set(result["factor_scores"]), {"demand", "capital", "profitability", "risk", "competition"})
        self.assertEqual(result["financial_plan"]["financing_needed"], 560000)
        self.assertFalse(result["generated_with_ai"])


if __name__ == "__main__":
    unittest.main()
