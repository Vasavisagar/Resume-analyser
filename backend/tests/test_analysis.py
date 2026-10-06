import unittest
import io
from unittest.mock import patch

import pymupdf
from docx import Document
from fastapi.testclient import TestClient

from app.main import analyze, app, find_skills, sections

client = TestClient(app)


class AnalysisTests(unittest.TestCase):
    def test_alias_normalization(self):
        self.assertIn("natural language processing", find_skills("NLP and Machine-learning"))
        self.assertIn("machine learning", find_skills("NLP and Machine-learning"))

    def test_sections_are_detected(self):
        result = sections("Skills\nPython\nExperience\nBuilt APIs\nEducation\nBSc Computer Science")
        self.assertIn("Python", result["skills"])
        self.assertIn("Built APIs", result["experience"])

    def test_required_gap_and_context_reported(self):
        resume = "Summary\nPython developer.\nSkills\nPython\nExperience\nDeveloped REST API services using Python.\nEducation\nBSc Computer Science"
        jd = "Required: Python and Docker. Preferred: Kubernetes. Build software."
        report = analyze(resume, jd)
        self.assertIn("python", report["skills"]["required_matched"])
        self.assertIn("docker", report["skills"]["required_missing"])
        self.assertIn("kubernetes", report["skills"]["preferred_missing"])
        self.assertIn("python", report["skills"]["context_evidence"])
        self.assertEqual(report["scores"]["job_match"], analyze(resume, jd)["scores"]["job_match"])

    def test_related_frameworks_remain_distinct(self):
        self.assertNotIn("tensorflow", find_skills("Used PyTorch for image classification"))

    def test_next_js_does_not_claim_javascript(self):
        self.assertNotIn("javascript", find_skills("Built the web app with Next.js."))
        self.assertIn("javascript", find_skills("Built the web app using JS."))

    def test_no_experience_duration_is_invented(self):
        result = analyze("Skills\nPython\nExperience\nUsed Python", "Python developer with 2+ years of experience building services.")
        self.assertIn("not inferred", result["experience"]["note"])

    def test_reported_score_reconstructs_from_displayed_components(self):
        result = analyze("Experience\nBuilt Python and SQL web services for customer products.", "Required Python and SQL for building customer web services.")
        scores = result["scores"]
        reconstructed = round(sum(scores["components"][name] * weight for name, weight in scores["weights"].items()))
        readiness = round(.35 * scores["ats_parsability"] + .65 * scores["job_match"])
        self.assertEqual(reconstructed, scores["job_match"])
        self.assertEqual(readiness, scores["application_readiness"])
        self.assertEqual(sum(scores["weights"].values()), 1.0)

    def test_upload_pdf_end_to_end(self):
        pdf = pymupdf.open()
        page = pdf.new_page()
        page.insert_text((72, 72), "Skills\nPython SQL\nExperience\nDeveloped software applications and APIs using Python and SQL.\nEducation\nBSc Computer Science")
        blob = pdf.tobytes()
        response = client.post("/api/analyze-upload", files={"resume": ("sample.pdf", blob, "application/pdf")}, data={"job_description": "Required Python and SQL for building applications and APIs in this role."})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertGreater(response.json()["extraction"]["characters"], 40)
        self.assertEqual(response.json()["skills"]["required_matched"], ["python", "sql"])

    def test_upload_docx_end_to_end(self):
        doc = Document()
        for line in ["Skills", "Python SQL", "Experience", "Developed APIs using Python and SQL.", "Education", "BSc Computer Science"]:
            doc.add_paragraph(line)
        stream = io.BytesIO()
        doc.save(stream)
        response = client.post("/api/analyze-upload", files={"resume": ("sample.docx", stream.getvalue(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}, data={"job_description": "Required Python and SQL for building applications and APIs in this role."})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertIn("experience", response.json()["sections_detected"])

    def test_invalid_upload_is_rejected(self):
        response = client.post("/api/analyze-upload", files={"resume": ("sample.exe", b"not a document", "application/octet-stream")}, data={"job_description": "A long enough job description with relevant details for a software engineer role."})
        self.assertEqual(response.status_code, 415)

    def test_malformed_pdf_signature_is_rejected(self):
        response = client.post("/api/analyze-upload", files={"resume": ("bad.pdf", b"%PDF-not-a-valid-document", "application/pdf")}, data={"job_description": "A long enough job description with relevant details for a software engineer role."})
        self.assertEqual(response.status_code, 422)

    def test_oversized_upload_is_rejected(self):
        response = client.post("/api/analyze-upload", files={"resume": ("large.pdf", b"%PDF-" + b"x" * (8 * 1024 * 1024), "application/pdf")}, data={"job_description": "A long enough job description with relevant details for a software engineer role."})
        self.assertEqual(response.status_code, 413)

    def test_guest_analysis_allowed_when_auth_is_optional(self):
        resume = "Resume summary with enough relevant detail about professional skills, experience, and education."
        jd = "A detailed software engineering role requires Python, SQL, and building dependable services for users."
        with patch("app.main.AUTH_ENABLED", True), patch("app.main.AUTH_REQUIRED", False), patch("app.main.SUPABASE_CONFIGURED", True):
            response = client.post("/api/analyze", json={"resume_text": resume, "job_description": jd})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertIn("scores", response.json())

    def test_guest_upload_works_but_cannot_save_history(self):
        pdf = pymupdf.open(); page = pdf.new_page()
        page.insert_text((72, 72), "Skills\nPython\nExperience\nBuilt Python services for analytics APIs and reliable data processing.\nEducation\nBSc Computer Science")
        jd = "A software developer role requires Python skills to build reliable analytics services and APIs."
        with patch("app.main.AUTH_ENABLED", True), patch("app.main.AUTH_REQUIRED", False), patch("app.main.SUPABASE_CONFIGURED", True):
            guest = client.post("/api/analyze-upload", files={"resume": ("resume.pdf", pdf.tobytes(), "application/pdf")}, data={"job_description": jd})
            save_attempt = client.post("/api/analyze-upload", files={"resume": ("resume.pdf", pdf.tobytes(), "application/pdf")}, data={"job_description": jd, "save_analysis": "true"})
        self.assertEqual(guest.status_code, 200, guest.text)
        self.assertEqual(save_attempt.status_code, 401)

    def test_sample_report_is_available_without_account(self):
        with patch("app.main.AUTH_REQUIRED", True):
            response = client.get("/api/demo")
        self.assertEqual(response.status_code, 200, response.text)
        self.assertTrue(response.json()["demo"])
        self.assertIn("scores", response.json())

    def test_auth_required_rejects_guest_analysis(self):
        resume = "Resume summary with enough relevant detail about professional skills, experience, and education."
        jd = "A detailed software engineering role requires Python, SQL, and building dependable services for users."
        with patch("app.main.AUTH_ENABLED", True), patch("app.main.AUTH_REQUIRED", True), patch("app.main.SUPABASE_CONFIGURED", True):
            response = client.post("/api/analyze", json={"resume_text": resume, "job_description": jd})
        self.assertEqual(response.status_code, 401)

    def test_auth_fails_closed_when_required_but_unconfigured(self):
        resume = "Resume summary with enough relevant detail about professional skills, experience, and education."
        jd = "A detailed software engineering role requires Python, SQL, and building dependable services for users."
        with patch("app.main.AUTH_ENABLED", True), patch("app.main.SUPABASE_CONFIGURED", False):
            response = client.post("/api/analyze", json={"resume_text": resume, "job_description": jd}, headers={"Authorization": "Bearer test-token"})
        self.assertEqual(response.status_code, 503)

    def test_browser_cors_preflight_allows_local_bearer_requests(self):
        response = client.options("/api/analyze-upload", headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type",
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["access-control-allow-origin"], "http://localhost:3000")
        self.assertIn("authorization", response.headers["access-control-allow-headers"].lower())

    def test_supabase_auth_validates_bearer_with_auth_service(self):
        resume = "Resume summary with enough relevant detail about professional skills, experience, and education."
        jd = "A detailed software engineering role requires Python, SQL, and building dependable services for users."
        with patch("app.main.AUTH_ENABLED", True), patch("app.main._validate_supabase_token", return_value={"id": "user-123"}) as validator:
            response = client.post("/api/analyze", json={"resume_text": resume, "job_description": jd}, headers={"Authorization": "Bearer unit-test-token"})
        self.assertEqual(response.status_code, 200, response.text)
        validator.assert_called_once_with("unit-test-token")

    def test_preferred_skill_is_not_misclassified_when_alias_used(self):
        result = analyze("Experience\nBuilt language models using NLP for search products.", "Required Python experience. Preferred: Natural Language Processing for product search.")
        self.assertIn("natural language processing", result["skills"]["preferred_matched"])
        self.assertIn("python", result["skills"]["required_missing"])

    def test_skill_only_listing_is_not_contextual_evidence(self):
        result = analyze("Skills\nPython\nSQL\nExperience\nSupported a team.", "Required Python and SQL skills for data work on product services.")
        self.assertEqual(result["skills"]["context_evidence"], [])

    def test_role_specific_guidance_redaction(self):
        from app.main import _redact_for_external_model
        redacted = _redact_for_external_model("Email Jane@example.com or call +1 (555) 123-4567; portfolio https://example.com")
        self.assertNotIn("Jane@example.com", redacted)
        self.assertNotIn("555", redacted)
        self.assertNotIn("https://example.com", redacted)

    def test_preferred_heading_applies_to_following_line_items(self):
        report = analyze("Experience\nBuilt Python services for customers.", "Required Skills\nPython\nPreferred Skills\nKubernetes\nTerraform")
        self.assertIn("kubernetes", report["skills"]["preferred_missing"])

    def test_supabase_persistence_uses_validated_owner_and_returns_id(self):
        pdf = pymupdf.open(); page = pdf.new_page()
        page.insert_text((72, 72), "Skills\nPython\nExperience\nDeveloped a Python API for web services with reliable testing and deployment practices.\nEducation\nBSc Computer Science")
        jd = "A software developer role requiring Python to implement and maintain dependable API services."
        with patch("app.main.AUTH_ENABLED", True), patch("app.main.SUPABASE_CONFIGURED", True), patch("app.main._validate_supabase_token", return_value={"id": "owner-42"}), patch("app.main._supabase_insert_analysis", return_value="analysis-7") as insert:
            response = client.post("/api/analyze-upload", files={"resume": ("resume.pdf", pdf.tobytes(), "application/pdf")}, data={"job_description": jd, "save_analysis": "true"}, headers={"Authorization": "Bearer test-token"})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["saved_analysis_id"], "analysis-7")
        self.assertEqual(insert.call_args.args[1], "owner-42")

    def test_nvidia_unavailable_does_not_lose_deterministic_report(self):
        pdf = pymupdf.open(); page = pdf.new_page()
        page.insert_text((72, 72), "Skills\nPython\nExperience\nDeveloped a Python API for web services with reliable testing and deployment practices.\nEducation\nBSc Computer Science")
        jd = "A software developer role requiring Python to implement and maintain dependable API services."
        with patch("app.main.NVIDIA_API_KEY", ""):
            response = client.post("/api/analyze-upload", files={"resume": ("resume.pdf", pdf.tobytes(), "application/pdf")}, data={"job_description": jd, "nvidia_enhance": "true"})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertIn("scores", response.json())
        self.assertIn("nvidia_error", response.json())


if __name__ == "__main__":
    unittest.main()
