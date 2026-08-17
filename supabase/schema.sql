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

-- Cupo mensual de tokens + historial de gastos (sobrevive redeploys de Render)
create table if not exists public.l8_token_accounts (
  account_key text primary key,
  current_period text not null default '',
  allowance integer not null default 10000,
  used integer not null default 0,
  commands integer not null default 0,
  externals integer not null default 0,
  clones integer not null default 0,
  notepads integer not null default 0,
  toolkits integer not null default 0,
  periods jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.l8_token_accounts
  add column if not exists notepads integer not null default 0;

alter table public.l8_token_accounts
  add column if not exists toolkits integer not null default 0;

create index if not exists l8_token_accounts_updated_at_idx
  on public.l8_token_accounts (updated_at desc);

create table if not exists public.l8_token_ledger (
  id text primary key,
  account_key text not null,
  period text not null default '',
  kind text not null default 'command',
  cost integer not null default 0,
  detail text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists l8_token_ledger_account_created_idx
  on public.l8_token_ledger (account_key, created_at desc);

create index if not exists l8_token_ledger_account_period_idx
  on public.l8_token_ledger (account_key, period);

alter table public.l8_repos enable row level security;
alter table public.l8_files enable row level security;
alter table public.l8_sessions enable row level security;
alter table public.l8_auth_accounts enable row level security;
alter table public.l8_auth_identities enable row level security;
alter table public.l8_token_accounts enable row level security;
alter table public.l8_token_ledger enable row level security;

-- Registro de Claves Hashcod (contraseñas / códigos por cuenta)
-- secret/code se almacenan cifrados (AES-256-GCM) desde el backend PHP.
create table if not exists public.l8_hashcod_keys (
  id text primary key,
  account_key text not null,
  name text not null default '',
  secret text not null default '',
  code text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists l8_hashcod_keys_account_created_idx
  on public.l8_hashcod_keys (account_key, created_at desc);

alter table public.l8_hashcod_keys enable row level security;

-- =====================================================================
-- RLS: deny-by-default para anon + authenticated (JWT).
-- El backend PHP usa SUPABASE_SECRET_KEY / service_role, que BYPASSEA RLS.
-- Nunca uses la publishable/anon key para leer estas tablas desde el cliente.
-- =====================================================================
drop policy if exists "service only repos" on public.l8_repos;
drop policy if exists "service only files" on public.l8_files;
drop policy if exists "service only sessions" on public.l8_sessions;
drop policy if exists "service only auth accounts" on public.l8_auth_accounts;
drop policy if exists "service only auth identities" on public.l8_auth_identities;
drop policy if exists "service only token accounts" on public.l8_token_accounts;
drop policy if exists "service only token ledger" on public.l8_token_ledger;
drop policy if exists "service only hashcod keys" on public.l8_hashcod_keys;

drop policy if exists "deny all anon repos" on public.l8_repos;
drop policy if exists "deny all authenticated repos" on public.l8_repos;
drop policy if exists "deny all anon files" on public.l8_files;
drop policy if exists "deny all authenticated files" on public.l8_files;
drop policy if exists "deny all anon sessions" on public.l8_sessions;
drop policy if exists "deny all authenticated sessions" on public.l8_sessions;
drop policy if exists "deny all anon auth accounts" on public.l8_auth_accounts;
drop policy if exists "deny all authenticated auth accounts" on public.l8_auth_accounts;
drop policy if exists "deny all anon auth identities" on public.l8_auth_identities;
drop policy if exists "deny all authenticated auth identities" on public.l8_auth_identities;
drop policy if exists "deny all anon token accounts" on public.l8_token_accounts;
drop policy if exists "deny all authenticated token accounts" on public.l8_token_accounts;
drop policy if exists "deny all anon token ledger" on public.l8_token_ledger;
drop policy if exists "deny all authenticated token ledger" on public.l8_token_ledger;
drop policy if exists "deny all anon hashcod keys" on public.l8_hashcod_keys;
drop policy if exists "deny all authenticated hashcod keys" on public.l8_hashcod_keys;

-- Políticas explícitas USING (false): bloquean SELECT/INSERT/UPDATE/DELETE a roles cliente.
create policy "deny all anon repos" on public.l8_repos
  for all to anon using (false) with check (false);
create policy "deny all authenticated repos" on public.l8_repos
  for all to authenticated using (false) with check (false);

create policy "deny all anon files" on public.l8_files
  for all to anon using (false) with check (false);
create policy "deny all authenticated files" on public.l8_files
  for all to authenticated using (false) with check (false);

create policy "deny all anon sessions" on public.l8_sessions
  for all to anon using (false) with check (false);
create policy "deny all authenticated sessions" on public.l8_sessions
  for all to authenticated using (false) with check (false);

create policy "deny all anon auth accounts" on public.l8_auth_accounts
  for all to anon using (false) with check (false);
create policy "deny all authenticated auth accounts" on public.l8_auth_accounts
  for all to authenticated using (false) with check (false);

create policy "deny all anon auth identities" on public.l8_auth_identities
  for all to anon using (false) with check (false);
create policy "deny all authenticated auth identities" on public.l8_auth_identities
  for all to authenticated using (false) with check (false);

create policy "deny all anon token accounts" on public.l8_token_accounts
  for all to anon using (false) with check (false);
create policy "deny all authenticated token accounts" on public.l8_token_accounts
  for all to authenticated using (false) with check (false);

create policy "deny all anon token ledger" on public.l8_token_ledger
  for all to anon using (false) with check (false);
create policy "deny all authenticated token ledger" on public.l8_token_ledger
  for all to authenticated using (false) with check (false);

create policy "deny all anon hashcod keys" on public.l8_hashcod_keys
  for all to anon using (false) with check (false);
create policy "deny all authenticated hashcod keys" on public.l8_hashcod_keys
  for all to authenticated using (false) with check (false);

-- =====================================================================
-- SUPABASE STORAGE: Políticas RLS para buckets y objetos (l8-storage)
-- Bloquea acceso público / anónimo directo por URL de Supabase CDN.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('l8-storage', 'l8-storage', false, 104857600, null)
on conflict (id) do update set public = false;

alter table if exists storage.objects enable row level security;

drop policy if exists "deny anon direct read l8-storage" on storage.objects;
drop policy if exists "deny authenticated direct read l8-storage" on storage.objects;
drop policy if exists "deny anon direct write l8-storage" on storage.objects;
drop policy if exists "deny authenticated direct write l8-storage" on storage.objects;

create policy "deny anon direct read l8-storage" on storage.objects
  for select to anon using (false);

create policy "deny authenticated direct read l8-storage" on storage.objects
  for select to authenticated using (false);

create policy "deny anon direct write l8-storage" on storage.objects
  for insert to anon with check (false);

create policy "deny authenticated direct write l8-storage" on storage.objects
  for insert to authenticated with check (false);

