# Evaluation plan and status

No labeled resume/JD corpus or human judgments were supplied. No extraction precision/recall, ranking correlation, calibration, or human agreement metrics are claimed.

For a defensible evaluation, build an opt-in, de-identified annotated set spanning clean/scanned PDFs, DOCX, tables, columns, varied headings, synonym variants, weak context, keyword stuffing, required/preferred phrasing, and insufficient experience. Have two reviewers annotate extracted sections, skills, requirement strength, and pair relevance; adjudicate disagreements. Report extraction success, skill precision/recall/F1, requirement classification precision/recall/F1, and ranking correlation against human judgments. Compare skill overlap, TF-IDF, semantic embeddings, and the hybrid using identical splits. Keep user resumes out of evaluation data unless explicit consent is obtained.

Current implementation provides deterministic heuristic outputs and a TF-IDF lexical baseline. `backend/backtest.py` runs five synthetic regression scenarios (14 expected-skill/score assertions) and samples 50 local analyzer-only durations. These checks catch regressions; they are not model accuracy metrics, representative data, human validation, or a production load test. OCR and transformer embeddings are not included, and model quality is unmeasured.
