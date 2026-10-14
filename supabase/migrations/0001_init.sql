-- Sanger High Boys Soccer (varsity): initial schema.
-- All access goes through the Next.js server using the service-role key.
-- RLS is enabled with NO policies, so the anon key can read/write nothing.

create extension if not exists pgcrypto;

create type submission_status as enum ('submitted', 'approved', 'hidden');
create type event_visibility as enum ('public', 'team', 'staff');
create type event_type as enum ('game', 'practice', 'showcase', 'meeting', 'travel', 'other');

create table players (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  full_name     text not null,
  preferred_name text,
  grade         smallint check (grade between 9 and 12),
  jersey_number smallint check (jersey_number between 0 and 99),
  positions     text[] not null default '{}',
  email         text not null,
  phone         text,
  parent_name   text,
  parent_contact text,
  social_handle text,
  photo_permission boolean not null default false,
  status        submission_status not null default 'submitted',
  auth_user_id  uuid unique,            -- filled when the player creates an account (later phase)
  constraint players_email_unique unique (email)
);

create table profiles (
  player_id        uuid primary key references players(id) on delete cascade,
  updated_at       timestamptz not null default now(),
  bio              text,
  years_playing    text,
  previous_teams   text,
  strengths        text,
  working_on       text,
  why_i_play       text,
  fun_fact         text,
  after_hs_plans   text,
  goals_individual text,
  goals_team       text,
  goals_from_coaches text,
  photo_path       text                 -- object path in the private 'player-photos' bucket
);

create table staff (
  id         uuid primary key default gen_random_uuid(),
  full_name  text not null,
  role       text not null,             -- head coach, assistant, manager...
  owns       text,                      -- video, social, equipment...
  email      text,
  phone      text
);

create table events (
  id          uuid primary key default gen_random_uuid(),
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  all_day     boolean not null default false,
  type        event_type not null default 'game',
  title       text not null,            -- "vs. Clovis West"
  location    text,
  notes       text,                     -- only shown to team/staff views
  visibility  event_visibility not null default 'public',
  source_key  text unique               -- stable key so CSV re-imports update instead of duplicate
);

create index events_starts_at_idx on events (starts_at);

alter table players  enable row level security;
alter table profiles enable row level security;
alter table staff    enable row level security;
alter table events   enable row level security;

-- Private bucket for player photos (served through signed URLs).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('player-photos', 'player-photos', false, 4194304, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
