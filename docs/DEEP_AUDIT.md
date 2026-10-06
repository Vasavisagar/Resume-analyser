# Deep audit and regression status

## Defects found and addressed

- Preferred-skill parsing searched only for the canonical spelling. JD aliases could be assigned the wrong requirement strength. It now uses alias occurrence spans, nearby wording, and preferred/required heading context.
- Contextual evidence used to be granted when any action verb appeared anywhere in a resume. Evidence is now limited to the same sentence as a matched skill in Summary, Experience, or Projects. A skills-only mention does not count as contextual proof.
- The `js` alias could misread `Next.js` as JavaScript. The short alias is now case-sensitive and only matches standalone `JS`.
- Analysis components were served without account checks. When Supabase is configured, the API validates bearer tokens with Supabase Auth; save requests reuse the validated user's token, so RLS remains the database authority. Without Supabase config, the service clearly reports local demo mode.
- Optional NVIDIA failure previously risked failing the whole request. Its failure now leaves the deterministic report intact.
- Contact data could be sent to the external model without UI awareness. The feature is opt-in and strips email, phone, and URL strings first; remaining identifiers are disclosed in the checkbox.
- The old root page mixed product introduction and analysis entry. `/` is now a landing page and `/analyze` is the upload and results flow.
- The score breakdown called its TF-IDF lexical cosine value “semantic relevance,” overstating the implementation. It is now labeled `tfidf_text_similarity` in the API/UI and documented as lexical similarity.
- The upload drop-zone text promised drag/drop without an event handler. A drop handler is now wired; backend validation still decides whether the dropped file is supported.

## Reproducible checks

- 22 backend unit/integration tests cover parsing, aliases, preferred skills, contextual evidence, reconstructable scoring, CORS bearer preflight, fail-closed auth behavior, owner-scoped save wiring, file upload paths, oversized/malformed rejection, and NVIDIA-unavailable fallback.
- 5 synthetic backtest cases run 14 expected-skill/score assertions and sample the analyzer 50 times for local median/p95/max timing. Those small synthetic cases are regression checks, not a general accuracy or production load benchmark.
- Frontend TypeScript check, optimized build, and npm audit are run by `audit-backtest.ps1`.
- `start-local.ps1` starts FastAPI and Next.js with hidden process windows, checks HTTP health, and optionally checks Supabase REST/table visibility. `stop-local.ps1` stops only the process trees recorded by the start script. `start-local.bat` is the double-click entry point.
- One audit attempt hit `EINVAL` reading a generated Next.js manifest after switching between dev and production in the OneDrive workspace. Dev and production now use separate `.next-dev` and `.next` output folders; the audit script refuses to build while port 3000 is active and retries a production build once. Both modes have since been exercised successfully.

## External checks still blocked

The Supabase project URL is now known, but there is no configured publishable/anon key or linked Supabase CLI project. A credential was found in `.env.example` during the follow-up integration audit and removed; rotate it before reuse. Authentication tests mock Supabase's user response; there was no real login or remote database to test. NVIDIA was tested only for the no-key fallback and contact redaction, not with a paid/authorized NIM call. The migration was not applied remotely. No representative or human-labelled resume corpus was supplied. The system has no rate limiter, OCR, robust duration/education extraction, or production deployment hardening.

The synthetic analyzer timings exclude PDF/DOCX parsing, browser upload, network, external inference, database writes, and concurrency; do not interpret them as end-to-end performance.
