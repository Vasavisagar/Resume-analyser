"""Run deterministic synthetic regression scenarios; this is not a model quality benchmark."""
import json
from pathlib import Path
from statistics import median
from time import perf_counter

from app.main import analyze


def main() -> int:
    cases = json.loads((Path(__file__).parent / "backtest_cases.json").read_text(encoding="utf-8"))
    failures = []
    rows = []
    durations_ms = []
    for case in cases:
        report = analyze(case["resume"], case["job_description"])
        for _ in range(10):
            started = perf_counter()
            analyze(case["resume"], case["job_description"])
            durations_ms.append((perf_counter() - started) * 1000)
        skills = report["skills"]
        checks = []
        for key in ("required_matched", "required_missing", "preferred_matched", "preferred_missing", "context_evidence"):
            if key in case:
                expected, actual = set(case[key]), set(skills[key])
                checks.append((key, expected == actual, sorted(expected), sorted(actual)))
        failed = [check for check in checks if not check[1]]
        rows.append({"name": case["name"], "job_match": report["scores"]["job_match"], "passed": len(checks) - len(failed), "checks": len(checks)})
        if failed:
            failures.append((case["name"], failed))
    by_name = {row["name"]: row["job_match"] for row in rows}
    score_checks = [
        ("contextual evidence raises score over skills-only", by_name["strong relevant evidence"] > by_name["skills-only mentions lack contextual evidence"]),
        ("relevant evidence scores over a non-identical missing framework", by_name["strong relevant evidence"] > by_name["related framework is not an exact match"]),
    ]
    ordered = sorted(durations_ms)
    p95 = ordered[min(len(ordered) - 1, int(len(ordered) * 0.95))]
    print(json.dumps({
        "scenarios": len(rows), "checks": sum(row["checks"] for row in rows) + len(score_checks), "failures": len(failures) + sum(not passed for _, passed in score_checks),
        "analysis_latency_ms_50_runs": {"median": round(median(durations_ms), 2), "p95": round(p95, 2), "max": round(max(durations_ms), 2)},
        "timing_scope": "Python analyzer only; excludes file extraction, network, Supabase, and NVIDIA. Five small synthetic samples are not a production load test.",
        "score_invariants": [{"name": name, "passed": passed} for name, passed in score_checks], "results": rows,
    }, indent=2))
    for name, failed_checks in failures:
        for key, _, expected, actual in failed_checks:
            print(f"FAIL {name}: {key}, expected={expected}, actual={actual}")
    for name, passed in score_checks:
        if not passed:
            print(f"FAIL score invariant: {name}")
    return 1 if failures or any(not passed for _, passed in score_checks) else 0


if __name__ == "__main__":
    raise SystemExit(main())
