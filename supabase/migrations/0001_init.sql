-- Intake: initial schema. Single-user app; all access goes through the service role.

create extension if not exists pgcrypto;

-- Profile (single row, id = 1) -----------------------------------------------
create table if not exists public.profile (
  id                      int primary key default 1 check (id = 1),
  date_of_birth           date,
  sex                     text check (sex in ('male', 'female')),
  height_cm               numeric check (height_cm > 0),
  activity_level          text check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal                    text check (goal in ('lose', 'maintain', 'gain')),
  pace_kg_per_week        numeric check (pace_kg_per_week in (0.25, 0.5, 0.75)),
  goal_note               text,
  review_tone             text not null default 'blunt' check (review_tone in ('blunt', 'gentle')),
  save_camera_photos      boolean not null default true,
  kcal_override           numeric,
  protein_g_override      numeric,
  carbs_g_override        numeric,
  fat_g_override          numeric,
  fiber_g_override        numeric,
  sugar_g_max_override    numeric,
  sodium_mg_max_override  numeric,
  onboarded               boolean not null default false
);

insert into public.profile (id) values (1) on conflict (id) do nothing;

-- Weight logs -----------------------------------------------------------------
create table if not exists public.weight_logs (
  id         uuid primary key default gen_random_uuid(),
  logged_at  timestamptz not null default now(),
  log_date   date not null,
  weight_kg  numeric not null check (weight_kg > 0)
);

create index if not exists weight_logs_log_date_idx on public.weight_logs (log_date);
create index if not exists weight_logs_logged_at_idx on public.weight_logs (logged_at desc);

-- Meals -----------------------------------------------------------------------
create table if not exists public.meals (
  id          uuid primary key default gen_random_uuid(),
  eaten_at    timestamptz not null default now(),
  log_date    date not null,
  meal_label  text not null check (meal_label in ('breakfast', 'lunch', 'dinner', 'snack')),
  input_text  text,
  had_image   boolean not null default false,
  items       jsonb not null default '[]'::jsonb,
  kcal        numeric not null default 0,
  protein_g   numeric not null default 0,
  carbs_g     numeric not null default 0,
  fat_g       numeric not null default 0,
  fiber_g     numeric not null default 0,
  sugar_g     numeric not null default 0,
  sodium_mg   numeric not null default 0,
  confidence  text not null check (confidence in ('high', 'medium', 'low')),
  ai_notes    text,
  created_at  timestamptz not null default now()
);

create index if not exists meals_log_date_idx on public.meals (log_date);

-- Daily targets snapshot (taken at the first meal save of a day) -------------
create table if not exists public.daily_targets (
  log_date  date primary key,
  targets   jsonb not null
);

-- Daily reviews ---------------------------------------------------------------
create table if not exists public.daily_reviews (
  log_date      date primary key,
  score         int not null check (score between 0 and 100),
  summary       text not null,
  wins          jsonb not null default '[]'::jsonb,
  improvements  jsonb not null default '[]'::jsonb,
  tomorrow_tip  text not null,
  totals        jsonb not null,
  created_at    timestamptz not null default now()
);

-- Login attempts (rate limiting) ---------------------------------------------
create table if not exists public.login_attempts (
  id            bigint generated always as identity primary key,
  ip            text not null,
  attempted_at  timestamptz not null default now()
);

create index if not exists login_attempts_ip_time_idx on public.login_attempts (ip, attempted_at desc);

-- Row level security: enabled everywhere, no policies. Only the service role
-- (which bypasses RLS) can read or write.
alter table public.profile        enable row level security;
alter table public.weight_logs    enable row level security;
alter table public.meals          enable row level security;
alter table public.daily_targets  enable row level security;
alter table public.daily_reviews  enable row level security;
alter table public.login_attempts enable row level security;
