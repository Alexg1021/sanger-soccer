-- Dashboard support: manual player adds, expected roster, protected manual event edits.

-- Coaches can add a player by hand before they have an email.
alter table players alter column email drop not null;

-- Names the coach expects to hear from, so the dashboard can show who is missing.
create table if not exists expected_players (
  id        uuid primary key default gen_random_uuid(),
  full_name text not null,
  created_at timestamptz not null default now()
);
create unique index if not exists expected_players_name_idx on expected_players (lower(full_name));
alter table expected_players enable row level security;

-- Events edited by hand in the dashboard are skipped by the CSV importer so edits aren't overwritten.
alter table events add column if not exists manually_edited boolean not null default false;
