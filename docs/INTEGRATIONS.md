# Supabase and NVIDIA setup

## Supabase Auth and optional saved analyses

1. Copy `.env.example` to `.env` in the repository root.
2. The project URL is prefilled in `.env.example` from the supplied database host. From Supabase Project Settings → API, enter a publishable/anon key as `SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Do not use a service-role key or the Postgres password for Auth.
3. Set `AUTH_REQUIRED=true` after entering the key. The API verifies each bearer access token by asking the project's Auth `/auth/v1/user` endpoint. Do not trust a user ID supplied in the request.
4. Link the Supabase CLI to the intended project and apply `supabase/migrations/0001_initial.sql`. The schema stores only the JD and derived analysis JSON. Row-level security binds operations to `auth.uid()`.
5. Run `start-local.bat`. It reports whether the API sees the configuration and checks REST reachability/table visibility without printing keys.
6. Create/sign in to an account on `/analyze`. Saving an analysis is separately opt-in. The uploaded resume is processed in memory and is never inserted into Supabase.

The project URL is known, but no publishable/anon key is configured in the workspace. Therefore live Auth, migration, RLS, and database-save calls remain unverified until the leaked database password is rotated, the migration is applied, and fresh public Auth settings are configured locally.

`DATABASE_URL` in `.env` is a placeholder for PostgreSQL CLI/direct connection checks. The application does not use this privileged database URL; its sign-in and optional report persistence use the Supabase Auth and REST APIs with the publishable/anon key and the signed-in user's JWT. Replace `[YOUR-PASSWORD]` locally only after rotating the shared database password. URL-encode reserved characters in the password.

## NVIDIA NIM role guidance

Set a newly issued `NVIDIA_API_KEY` in the backend environment and optionally change `NVIDIA_MODEL`. The default is `openai/gpt-oss-20b`; requests use the NVIDIA OpenAI-compatible `/v1/chat/completions` endpoint with `reasoning_effort: "medium"`, grounded in the supplied resume evidence and target job description. The model is advisory and cannot change deterministic score values. Users must opt in on `/analyze`. Email addresses, phone numbers, and URLs are removed; names and other identifiers may remain. Inference failures preserve the deterministic report. A key was found in the checked-in-style example template and removed; revoke it before using NVIDIA.

NVIDIA documents the endpoint, default model and medium reasoning option in its [GPT-OSS 20B NIM API reference](https://docs.api.nvidia.com/nim/reference/openai-gpt-oss-20b-infer).
