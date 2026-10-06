-- Opt-in persistence schema for analysis metadata and derived results.
create extension if not exists pgcrypto;
create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  job_description text not null check (length(job_description) between 40 and 30000),
  result jsonb not null,
  created_at timestamptz not null default now()
);
create index analyses_owner_created_idx on public.analyses(owner_id, created_at desc);
alter table public.analyses enable row level security;
create policy "owners manage analyses" on public.analyses for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
