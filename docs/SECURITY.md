# Security and privacy

- Upload endpoint accepts only PDF/DOCX extensions, matching declared MIME types, basic file signatures, and files up to 8 MiB.
- Files are parsed from memory, not named temporary paths, stored in a database, or included in application logs. The upload stream is closed after processing.
- Extracted content is bounded before analysis; malformed parser errors return a generic 422 response.
- Supabase access tokens are validated against the configured Supabase Auth `/auth/v1/user` endpoint before analysis when Supabase is configured. Set `AUTH_REQUIRED=true` to fail closed when deploying. With no Supabase settings, the API intentionally runs unauthenticated local-demo mode and is not safe to expose on a network.
- The API has no rate limiting or production deployment policy. Add those controls, TLS, and an explicit abuse strategy before public deployment.
- CORS is limited to the local Next.js origin. Configure exact deployed origins before deployment.
- Optional analysis persistence calls Supabase REST using the signed-in user's token; RLS remains authoritative. It stores the JD and derived report only, never the resume file. Never expose a service-role key to the frontend or API environment.
- Optional NVIDIA role guidance requires an explicit UI checkbox. The backend removes email addresses, phone numbers, and URLs, but may send names or other identifiers in resume text to NVIDIA. The user's consent is required before that external transfer. NVIDIA failure returns the deterministic result without losing the analysis.
- The system does not use demographics or infer personality. It does not anonymize names or contact details from the analysis text.
