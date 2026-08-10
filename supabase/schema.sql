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

-- Cuentas auth (solo hashes; nunca claves en claro)
create table if not exists public.l8_auth_accounts (
  id text primary key,
  aes256_hash text not null,
  identity_hash text not null,
  recovery_hash text,
  backup_codes jsonb not null default '{}'::jsonb,
  created_at timestamptz,
  recovered_at timestamptz,
  updated_at timestamptz default now(),
  meta jsonb not null default '{}'::jsonb
);

-- Índice de identidades / recuperación (hash → cuenta)
create table if not exists public.l8_auth_identities (
  hash text primary key,
  account_id text not null references public.l8_auth_accounts(id) on delete cascade,
  kind text not null check (kind in ('aes256', 'identity', 'recovery_key', 'backup_code')),
  used boolean default false,
  updated_at timestamptz default now()
);

create index if not exists l8_auth_identities_account_idx on public.l8_auth_identities(account_id);
create index if not exists l8_auth_identities_kind_idx on public.l8_auth_identities(kind);

alter table public.l8_repos enable row level security;
alter table public.l8_files enable row level security;
alter table public.l8_sessions enable row level security;
alter table public.l8_auth_accounts enable row level security;
alter table public.l8_auth_identities enable row level security;

-- Service role bypasses RLS; keep policies locked for anon by default.
drop policy if exists "service only repos" on public.l8_repos;
drop policy if exists "service only files" on public.l8_files;
drop policy if exists "service only sessions" on public.l8_sessions;
drop policy if exists "service only auth accounts" on public.l8_auth_accounts;
drop policy if exists "service only auth identities" on public.l8_auth_identities;
