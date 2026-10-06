# Explainable Resume Evaluator

An explainable, job-specific resume evaluation tool. It separates estimated ATS parsability from job match and application readiness; it does not reproduce a proprietary ATS score or predict hiring outcomes.

## Architecture

- `frontend/`: Next.js landing page (`/`) and analysis/auth UI (`/analyze`).
- `backend/`: FastAPI document extraction, deterministic matching, optional Supabase auth/persistence, and consent-gated NVIDIA role guidance.
- `supabase/migrations/`: RLS-protected analyses table. Resume binaries are never persisted.

## Development

Backend: `cd backend; python -m venv .venv; .venv\\Scripts\\Activate.ps1; pip install -r requirements.txt; uvicorn app.main:app --reload`

Frontend: `cd frontend; npm install; npm run dev`. Set `NEXT_PUBLIC_API_URL=http://localhost:8000` if the API is hosted elsewhere. The product landing page is `/`; start an analysis at `/analyze`.

On Windows, copy `.env.example` to `.env`, add Supabase/NVIDIA settings locally, then run `start-local.bat`. It starts the API and frontend and checks Supabase REST connectivity/table visibility. Use `stop-local.ps1` to stop those processes. Without Supabase values, local demo mode disables authentication/account persistence and is bound to loopback; do not expose it to a network.

To link/apply the database migration, install/use the Supabase CLI, authenticate and link this folder to your Supabase project, then run `supabase db push`. Review `supabase/migrations/0001_initial.sql` before applying it. The project URL is prefilled from the supplied database hostname, but the Auth publishable key is not configured and no migration was sent to the remote database.

Backtests and audit: `audit-backtest.ps1` (or `cd backend; python -m unittest discover -s tests -v; python backtest.py`). The backtest output includes a small local analyzer latency sample; it is not a production load test. Frontend checks: `cd frontend; npm run lint; npm run build; npm audit`.

API documentation is available at `/docs`. See `docs/SCORING.md`, `docs/SECURITY.md`, `docs/EVALUATION.md`, `docs/INTEGRATIONS.md`, and `docs/DEEP_AUDIT.md` for the formulas, setup, and audit details.

## Current limitations

Matching uses a transparent built-in skill/alias lexicon and deterministic lexical/section heuristics. Semantic relevance uses TF-IDF cosine similarity as a lightweight baseline. No OCR or transformer embedding model is bundled. The results are estimates and require human review.
