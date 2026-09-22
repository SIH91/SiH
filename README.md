# LocoBiz AI backend

An MVP API for the PRD's business-feasibility workflow. It accepts entrepreneur, business, and capital inputs and produces an explainable feasibility score, financial plan, scheme screening matches, risk flags, and DPR-ready structured data.

## Design choices

- The feasibility score is deterministic and fully explained by five factors: demand, capital, profitability, risk, and competition.
- All financial estimates include a source (`user`, `system_estimate`, or `calculated`) and are retained in the response assumptions.
- Scheme matches are screening matches only and always require eligibility verification.
- The API explicitly states that its analysis is not a loan approval or success guarantee.
- When `OPENAI_API_KEY` is set on the server, the Responses API adds guarded, non-authoritative AI guidance to every module: feasibility, market, financials, risks, scheme screening, and DPR. It never changes the formula-based score.

## Run

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

Open `http://127.0.0.1:8000/docs` to test `POST /api/v1/evaluations/analyze`.

Use `POST /api/v1/chat` for the website chat widget. A greeting such as `hey` receives a neutral LocoBiz greeting, never fabricated financial or scheme claims. Configure `CORS_ALLOWED_ORIGINS` with the website's origin before deployment.

## Enable OpenAI insights

1. Copy `.env.example` to `.env` (do not commit `.env`).
2. Add your OpenAI API key as `OPENAI_API_KEY` in your deployment environment or shell.
3. Start the API with that environment variable available. `GET /api/v1/ai/status` will then report `openai_responses`.

The API sends only the evaluation payload needed for the narrative response, requests strict JSON output, and uses `store=False`. The key is never returned to the browser or written to the repository.

## Test

```powershell
python -m unittest discover -s tests
```

## Next integrations

Connect authoritative government-scheme, mandi, geospatial, and market data before labelling any such data as verified. An OpenAI API-powered narrative layer may be added through a server-only `OPENAI_API_KEY`; do not expose that key to the browser.
