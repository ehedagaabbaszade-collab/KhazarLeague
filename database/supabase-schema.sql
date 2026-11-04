-- Run once in Supabase SQL Editor.
create table if not exists public.league_state (id integer primary key check (id = 1), payload jsonb not null, updated_at timestamptz not null default now());
alter table public.league_state enable row level security;
revoke all on table public.league_state from anon, authenticated;


-- Immutable pre-change snapshots. Written only by the backend service-role key.
create table if not exists public.league_backups (
  id bigint generated always as identity primary key,
  source_updated_at timestamptz,
  created_at timestamptz not null default now(),
  payload jsonb not null
);
alter table public.league_backups enable row level security;
revoke all on table public.league_backups from anon, authenticated;
create index if not exists league_backups_created_at_idx on public.league_backups (created_at desc);
