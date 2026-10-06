# Requirement evidence matrix

Status as of 2026-10-06. PASS means the local path was exercised. Unverified cloud rows were not represented as complete.

| Requirement | Implementation | Evidence | Status |
|---|---|---|---|
| Homepage and analysis page | Next.js `/` and `/analyze` | Production build emits both routes; local HTTP checks return 200 and expected text | PASS |
| PDF/DOCX extraction | PyMuPDF and python-docx | Generated PDF and DOCX multipart integration tests pass | PASS |
| Upload validation | Extension, MIME, signature, 8 MiB cap, text/JD limits | Unsupported extension, malformed PDF, and >8 MiB cases return expected errors | PASS for tested boundaries |
| Skills and aliases | Finite vocabulary; hyphen and alias normalization | Alias tests, Next.js/JS false-positive regression test | PARTIAL |
| Exact/normalized matching | Exact skill alias sets and lexical TF-IDF are used | Alias and related-tool separation regressions pass | PARTIAL |
| True semantic embeddings | No embedding model; TF-IDF is explicitly labeled lexical text similarity | None; the UI no longer mislabels TF-IDF as semantic matching | NOT IMPLEMENTED |
| Related skill explanations | PyTorch/TensorFlow remain separate, but no taxonomy-based related-skill explanation is generated | No taxonomy or relatedness scorer exists | NOT IMPLEMENTED |
| Required/preferred extraction | Local phrasing plus heading cues | Alias and separate preferred-heading tests pass | PARTIAL |
| Contextual evidence | Skill/action-verb co-occurrence in summary/experience/projects | Skill-only list regression and contextual test pass | PARTIAL |
| Experience and education relevance | Section headings only; no date-duration or degree-equivalence analyzer | Exact years are deliberately not invented | NOT IMPLEMENTED beyond section detection |
| OCR and image-based PDF fallback | No OCR engine | Low-extraction PDFs return a readable error | NOT IMPLEMENTED |
| Formatting risk detection | Text length, images/tables metadata, conventional section headings | Does not detect columns, headers/footers, text in images, or reading order | PARTIAL |
| Recommendation quality | Deterministic gap-derived advice; optional role-conditioned NVIDIA advice | No human usefulness review; NVIDIA key absent | PARTIAL |
| Loading, validation, error UX | Required inputs, API errors, spinner, file picker and drag/drop | Build and HTTP paths pass; drag/drop itself not browser-automated | PARTIAL |
| Accessibility and responsive layout | Semantic forms and responsive CSS | Typecheck/build only; no automated WCAG/a11y scan or device matrix | PARTIAL |
| Job relevance baseline | TF-IDF cosine plus explicit components | Five synthetic cases / 14 assertions pass; no human-quality corpus | PARTIAL |
| Authentication | Supabase bearer token validation when configured; local demo fallback if not | Missing token 401 and mocked Auth validation tests pass | PARTIAL; live Supabase not configured |
| Supabase persistence | Opt-in REST insert with caller JWT; owner RLS migration | Save-path test verifies validated owner; actual project/table unavailable | PARTIAL; remote migration unverified |
| NVIDIA role guidance | Opt-in role-conditioned prompt, medium reasoning, contact redaction | No-key fallback preserves report; redaction test passes | PARTIAL; live inference unavailable |
| Privacy | Resume stays in memory; report persistence is explicit; NVIDIA transfer is consented | Code and API-path review; no uploaded binary goes to DB | PARTIAL |
| Frontend/static analysis | TypeScript check and optimized production build | `npm run lint` and `npm run build` passed; `/` and `/analyze` built | PASS |
| Dependency audit | npm lockfile graph | `npm audit`: zero vulnerabilities | PASS |
| Local orchestration | PowerShell start/stop, BAT entry, API/frontend checks | PowerShell AST parses; `start-local.ps1` started both processes; API and both pages returned 200 | PASS |
| Regression backtests | Synthetic deterministic scenarios | `python backtest.py`: 5 cases, 14 skill/score assertions, 0 failures | PASS for regression only |
| Analyzer speed | 50 small local `analyze()` runs | Latest Python venv audit: median 2.49 ms, p95 3.21 ms, max 3.88 ms | MEASURED; excludes extraction/network/DB/NVIDIA/concurrency |
| Human/model accuracy | No annotated dataset supplied | No precision/recall/F1 or human agreement claimed | NOT EVALUATED |
| OCR, date-based experience, education relevance | Not implemented | Scanned PDF explicitly rejected for insufficient text; duration remains uncertain | NOT IMPLEMENTED |
| Production security | No rate limiting, production hosting policy, or remote hardening | Local API binds to loopback; configured auth can fail closed | NOT READY for public deployment |

## Commands executed

- `python -m unittest discover -s tests -v` — 22 passed.
- `python backtest.py` — 5 synthetic cases, 14 checks passed; analyzer latency sampled over 50 runs.
- `npm run lint` — TypeScript check passed.
- `npm run build` — Next.js production build passed and includes `/` plus `/analyze`.
- `npm audit` — zero vulnerabilities.
- `start-local.ps1` — launched API and frontend; `/health`, `/`, and `/analyze` returned 200.
- `audit-backtest.ps1` — full audit script completed successfully.
- PowerShell AST parsing — `start-local.ps1`, `stop-local.ps1`, and `audit-backtest.ps1` all parse successfully.

The cloud Auth, database, and NVIDIA features are implemented behind local environment configuration, but remain unverified because the project has no configured publishable/anon key or usable NVIDIA key. The project URL is now prefilled from the supplied database hostname. See [INTEGRATIONS.md](INTEGRATIONS.md).
