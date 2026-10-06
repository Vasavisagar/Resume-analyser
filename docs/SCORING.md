# Scoring methodology

The API returns three distinct values: ATS parsability, job match, and application readiness. None is a vendor ATS score.

Job match is the rounded weighted sum of four 0–100 components: detected skill coverage including preferred skills (30%), TF-IDF cosine similarity between the full resume and JD (30%), contextual evidence proxy (25%), and required skill coverage (15%). Skill coverage is `100 * (matched_required + 0.5 * matched_preferred) / max(1, required_count + preferred_count)`. Context evidence counts a matched skill only when it appears in the same sentence as an action verb (`develop`, `built`, `create`, `implement`, `use`, `manage`, `design`, `lead`, `deliver`, or `automate`) in the detected Summary, Experience, or Projects section. Its component is `min(100, 45 + 55 * evidenced_required_skill_count / max(1, required_skill_count))`. This is intentionally a simple, inspectable proxy, not validated evidence classification. Application readiness is the rounded value of 35% ATS parsability and 65% job match.

ATS parsability starts at 100 and deducts 25 when resume text has fewer than 250 characters, 12 for detected images, 12 for detected DOCX tables, and 6 each for missing conventional Experience/Education headings (deductions are cumulative, floor 0). This is a heuristic. Weights are initial engineering choices, not empirically optimal. The skill lexicon and aliases are finite; related tools (e.g. PyTorch and TensorFlow) remain separate.

Scores are deterministic for the same text and extraction metadata. Exact experience duration, education equivalence, multi-column layouts, headers/footers, and image OCR are not reliably assessed in this version. Do not add a skill to a resume unless it reflects real experience.
