-- Run once in Supabase SQL Editor.
create table if not exists public.league_state (id integer primary key check (id = 1), payload jsonb not null, updated_at timestamptz not null default now());
alter table public.league_state enable row level security;
revoke all on table public.league_state from anon, authenticated;
