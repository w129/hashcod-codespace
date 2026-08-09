-- l8 codespace · Supabase Postgres schema (optional mirror)
-- Run this once in Supabase → SQL Editor, then the platform can use DB + Storage.

create table if not exists public.l8_repos (
  id text primary key,
  user_repo text not null unique,
  name text,
  branch text default 'main',
  remote_url text,
  license text,
  stars integer,
  is_private boolean default false,
  cloned boolean default false,
  meta jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.l8_files (
  id text primary key,
  filename text not null,
  mime_type text,
  size_bytes bigint default 0,
  hash text,
  storage_path text,
  supabase_object text,
  upload_date timestamptz default now()
);

create table if not exists public.l8_sessions (
  id text primary key default 'default',
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.l8_repos enable row level security;
alter table public.l8_files enable row level security;
alter table public.l8_sessions enable row level security;

-- Service role bypasses RLS; keep policies locked for anon by default.
drop policy if exists "service only repos" on public.l8_repos;
drop policy if exists "service only files" on public.l8_files;
drop policy if exists "service only sessions" on public.l8_sessions;
