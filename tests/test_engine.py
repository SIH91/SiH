import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from backend.engine import evaluate
from backend.chat import reply
from backend.main import app
from backend.narrative import enrich, is_configured
from backend.schemas import EvaluationRequest


class EvaluationEngineTests(unittest.TestCase):
    def test_location_search_returns_normalised_indian_place(self):
        with patch("backend.main.search_locations", AsyncMock(return_value=[{
            "id": 2869870, "name": "Nashik", "label": "Nashik, Maharashtra, India", "admin1": "Maharashtra", "country": "India", "country_code": "IN", "latitude": 19.9975, "longitude": 73.7898, "timezone": "Asia/Kolkata", "population": 1486053,
        }])):
            response = TestClient(app).get("/api/v1/locations/search?q=Nashik")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["results"][0]["label"], "Nashik, Maharashtra, India")
        self.assertEqual(response.json()["results"][0]["country_code"], "IN")
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
        fake_response = SimpleNamespace(output_text='''{
            "overview":"Useful plan.",
            "feasibility":{"summary":"Good fit.","recommendations":["Validate demand"],"data_status":"system_estimate"},
            "market":{"summary":"Research locally.","recommendations":["Survey buyers"],"data_status":"requires_verification"},
            "financials":{"summary":"Review costs.","recommendations":["Update expenses"],"data_status":"system_estimate"},
            "risks":{"summary":"Manage risk.","recommendations":["Keep reserves"],"data_status":"user_input"},
            "schemes":{"summary":"Check eligibility.","recommendations":["Use official portal"],"data_status":"requires_verification"},
            "dpr":{"summary":"Prepare report.","recommendations":["Review inputs"],"data_status":"user_input"}
        }''')
        create = MagicMock(return_value=fake_response)
        fake_client = SimpleNamespace(responses=SimpleNamespace(create=create))
        with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}, clear=True), patch("openai.OpenAI", return_value=fake_client):
            result = enrich({"feasibility_score": 72}, "en")
        self.assertEqual(result["overview"], "Useful plan.")
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
