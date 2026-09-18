-- =====================================================================
-- l8 codespace · Supabase Postgres Complete Schema (Immutable & Multi-Account)
-- Run this in Supabase → SQL Editor to enable full DB + Storage persistence.
-- Ensures everything executed and stored per account is permanently preserved.
-- =====================================================================

-- 1. Repositorios GitHub clonados o guardados por cuenta
create table if not exists public.l8_repos (
  id text primary key,
  account_key text not null default 'global',
  user_repo text not null,
  name text,
  branch text default 'main',
  remote_url text,
  license text,
  stars integer default 0,
  is_private boolean default false,
  cloned boolean default false,
  meta jsonb default '{}'::jsonb,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

alter table public.l8_repos add column if not exists account_key text not null default 'global';
alter table public.l8_repos add column if not exists is_deleted boolean not null default false;
alter table public.l8_repos add column if not exists deleted_at timestamptz;
alter table public.l8_repos add column if not exists created_at timestamptz default timezone('utc', now());

create index if not exists l8_repos_account_idx on public.l8_repos(account_key, is_deleted);
create index if not exists l8_repos_user_repo_idx on public.l8_repos(user_repo);

-- 2. Archivos Dilithium-5 PQC y archivos de usuario
create table if not exists public.l8_files (
  id text primary key,
  account_key text not null default 'global',
  filename text not null,
  mime_type text,
  size_bytes bigint default 0,
  hash text,
  storage_path text,
  supabase_object text,
  meta jsonb default '{}'::jsonb,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  upload_date timestamptz default timezone('utc', now())
);

alter table public.l8_files add column if not exists account_key text not null default 'global';
alter table public.l8_files add column if not exists is_deleted boolean not null default false;
alter table public.l8_files add column if not exists deleted_at timestamptz;
alter table public.l8_files add column if not exists meta jsonb default '{}'::jsonb;

create index if not exists l8_files_account_idx on public.l8_files(account_key, is_deleted);
create index if not exists l8_files_upload_date_idx on public.l8_files(upload_date desc);

-- 3. Historial Inmutable de Comandos Ejecutados (Nunca se elimina)
create table if not exists public.l8_command_history (
  id text primary key,
  account_key text not null,
  session_id text default 'default',
  raw_command text not null,
  normalized_command text default '',
  exit_code integer default 0,
  output_snippet text default '',
  duration_ms integer default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists l8_command_history_account_idx on public.l8_command_history(account_key, created_at desc);
create index if not exists l8_command_history_created_idx on public.l8_command_history(created_at desc);

-- 4. Registro Inmutable de Actividad de la Plataforma (Audit Trail)
create table if not exists public.l8_activity_log (
  id text primary key,
  account_key text not null,
  action text not null,
  target text default '',
  payload jsonb not null default '{}'::jsonb,
  ip_hash text default '',
  user_agent text default '',
  status text not null default 'ok',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists l8_activity_log_account_idx on public.l8_activity_log(account_key, created_at desc);
create index if not exists l8_activity_log_action_idx on public.l8_activity_log(action);

-- 5. Sesiones de Usuario y Estado del Terminal Tabby
create table if not exists public.l8_account_sessions (
  id text primary key,
  account_key text not null,
  state jsonb not null default '{}'::jsonb,
  is_deleted boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists l8_account_sessions_account_idx on public.l8_account_sessions(account_key);

create table if not exists public.l8_sessions (
  id text primary key default 'default',
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz default timezone('utc', now())
);

-- 6. Documentos de TipTap y LibreOffice Suite con Versionado
create table if not exists public.l8_documents (
  id text primary key,
  account_key text not null,
  title text not null default 'Documento sin título',
  doc_type text not null default 'tiptap',
  content text not null default '',
  meta jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists l8_documents_account_idx on public.l8_documents(account_key, doc_type, is_deleted);

-- 7. Historial Inmutable de Versiones de Documentos
create table if not exists public.l8_documents_history (
  id text primary key,
  document_id text not null references public.l8_documents(id) on delete cascade,
  account_key text not null,
  version integer not null,
  content text not null default '',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists l8_documents_history_doc_idx on public.l8_documents_history(document_id, version desc);

-- 8. Transferencias y Códigos PQC de Gateway
create table if not exists public.l8_gateway_transfers (
  id text primary key,
  account_key text not null,
  code text not null unique,
  filename text not null default '',
  mime_type text default '',
  size_bytes bigint default 0,
  storage_path text default '',
  downloads_count integer not null default 0,
  meta jsonb not null default '{}'::jsonb,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists l8_gateway_transfers_code_idx on public.l8_gateway_transfers(code);
create index if not exists l8_gateway_transfers_account_idx on public.l8_gateway_transfers(account_key);

-- 9. Libro Mayor de Códigos Únicos OpenCryptG
create table if not exists public.l8_opencrypt_ledger (
  id text primary key,
  account_key text not null,
  code text not null unique,
  meta jsonb not null default '{}'::jsonb,
  is_deleted boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists l8_opencrypt_ledger_code_idx on public.l8_opencrypt_ledger(code);
create index if not exists l8_opencrypt_ledger_account_idx on public.l8_opencrypt_ledger(account_key);

-- 10. Cuentas auth (solo hashes criptográficos, nunca claves en texto claro)
create table if not exists public.l8_auth_accounts (
  id text primary key,
  aes256_hash text not null,
  identity_hash text not null,
  recovery_hash text,
  backup_codes jsonb not null default '{}'::jsonb,
  created_at timestamptz,
  recovered_at timestamptz,
  updated_at timestamptz default timezone('utc', now()),
  meta jsonb not null default '{}'::jsonb
);

create table if not exists public.l8_auth_identities (
  hash text primary key,
  account_id text not null references public.l8_auth_accounts(id) on delete cascade,
  kind text not null check (kind in ('aes256', 'identity', 'recovery_key', 'backup_code')),
  used boolean default false,
  updated_at timestamptz default timezone('utc', now())
);

create index if not exists l8_auth_identities_account_idx on public.l8_auth_identities(account_id);
create index if not exists l8_auth_identities_kind_idx on public.l8_auth_identities(kind);

-- 11. Cupo mensual de tokens y Libro Mayor de transacciones
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

create index if not exists l8_token_accounts_updated_at_idx on public.l8_token_accounts (updated_at desc);

create table if not exists public.l8_token_ledger (
  id text primary key,
  account_key text not null,
  period text not null default '',
  kind text not null default 'command',
  cost integer not null default 0,
  detail text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists l8_token_ledger_account_created_idx on public.l8_token_ledger (account_key, created_at desc);
create index if not exists l8_token_ledger_account_period_idx on public.l8_token_ledger (account_key, period);

-- 12. Registro de Claves Hashcod (AES-256-GCM) por cuenta
create table if not exists public.l8_hashcod_keys (
  id text primary key,
  account_key text not null,
  name text not null default '',
  secret text not null default '',
  code text not null default '',
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.l8_hashcod_keys add column if not exists is_deleted boolean not null default false;
alter table public.l8_hashcod_keys add column if not exists deleted_at timestamptz;

create index if not exists l8_hashcod_keys_account_created_idx on public.l8_hashcod_keys (account_key, created_at desc);

-- 13. Estados de Aplicaciones (Streamlit, Toolkit OCR, Agentes IA)
create table if not exists public.l8_app_states (
  id text primary key,
  account_key text not null,
  app_id text not null,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists l8_app_states_account_app_idx on public.l8_app_states(account_key, app_id);

-- 14. Durable Objects: Actores con estado fuertemente consistente y alarmas
create table if not exists public.l8_durable_objects (
  id text primary key,
  account_key text not null,
  namespace text not null default 'default',
  name text not null default '',
  storage_data jsonb not null default '{}'::jsonb,
  alarm_at bigint,
  version bigint not null default 1,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists l8_durable_objects_acct_ns_idx on public.l8_durable_objects (account_key, namespace);
create index if not exists l8_durable_objects_alarm_idx on public.l8_durable_objects (alarm_at) where is_deleted = false;

-- 15. Durable Objects: Registro de Alarmas y Eventos Transaccionales
create table if not exists public.l8_durable_object_events (
  id text primary key,
  account_key text not null,
  namespace text not null,
  object_id text not null,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists l8_do_events_acct_obj_idx on public.l8_durable_object_events (account_key, object_id, created_at desc);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Deny-All for public/anon/authenticated tokens.
-- The PHP Backend uses the Service Role (SUPABASE_SECRET_KEY) which safely bypasses RLS.
-- =====================================================================

alter table public.l8_repos enable row level security;
alter table public.l8_files enable row level security;
alter table public.l8_sessions enable row level security;
alter table public.l8_command_history enable row level security;
alter table public.l8_activity_log enable row level security;
alter table public.l8_account_sessions enable row level security;
alter table public.l8_documents enable row level security;
alter table public.l8_documents_history enable row level security;
alter table public.l8_gateway_transfers enable row level security;
alter table public.l8_opencrypt_ledger enable row level security;
alter table public.l8_auth_accounts enable row level security;
alter table public.l8_auth_identities enable row level security;
alter table public.l8_token_accounts enable row level security;
alter table public.l8_token_ledger enable row level security;
alter table public.l8_hashcod_keys enable row level security;
alter table public.l8_app_states enable row level security;
alter table public.l8_durable_objects enable row level security;
alter table public.l8_durable_object_events enable row level security;
alter table public.l8_app_states enable row level security;

-- Deny policies for anon and authenticated clients
do $$
declare
  tbl text;
  tbls text[] := array[
    'l8_repos', 'l8_files', 'l8_sessions', 'l8_command_history',
    'l8_activity_log', 'l8_account_sessions', 'l8_documents',
    'l8_documents_history', 'l8_gateway_transfers', 'l8_opencrypt_ledger',
    'l8_auth_accounts', 'l8_auth_identities', 'l8_token_accounts',
    'l8_token_ledger', 'l8_hashcod_keys', 'l8_app_states',
    'l8_durable_objects', 'l8_durable_object_events'
  ];
begin
  foreach tbl in array tbls loop
    execute format('drop policy if exists %I on public.%I', 'deny anon ' || tbl, tbl);
    execute format('drop policy if exists %I on public.%I', 'deny authenticated ' || tbl, tbl);
    execute format('create policy %I on public.%I for all to anon using (false) with check (false)', 'deny anon ' || tbl, tbl);
    execute format('create policy %I on public.%I for all to authenticated using (false) with check (false)', 'deny authenticated ' || tbl, tbl);
  end loop;
end $$;

-- =====================================================================
-- SUPABASE STORAGE BUCKET & RLS
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('l8-storage', 'l8-storage', false, 104857600, null)
on conflict (id) do update set public = false;

alter table if exists storage.objects enable row level security;

drop policy if exists "deny anon direct read l8-storage" on storage.objects;
drop policy if exists "deny authenticated direct read l8-storage" on storage.objects;
drop policy if exists "deny anon direct write l8-storage" on storage.objects;
drop policy if exists "deny authenticated direct write l8-storage" on storage.objects;

create policy "deny anon direct read l8-storage" on storage.objects for select to anon using (false);
create policy "deny authenticated direct read l8-storage" on storage.objects for select to authenticated using (false);
create policy "deny anon direct write l8-storage" on storage.objects for insert to anon with check (false);
create policy "deny authenticated direct write l8-storage" on storage.objects for insert to authenticated with check (false);


-- =====================================================================
-- HASHCOD PLATFORM REGISTRATION INTAKE (18+)
-- Sensitive identity/contact data: backend service role only.
-- =====================================================================
create table if not exists public.hashcod_platform_registrations (
  id bigint generated by default as identity primary key,
  full_name_enc text not null check (full_name_enc like 'l8e1:%'),
  age smallint not null check (age between 18 and 120),
  cedula_enc text not null check (cedula_enc like 'l8e1:%'),
  platform_name text not null check (char_length(platform_name) between 2 and 120),
  email_enc text not null check (email_enc like 'l8e1:%'),
  phone_enc text not null check (phone_enc like 'l8e1:%'),
  created_at timestamptz not null default now()
);

alter table public.hashcod_platform_registrations enable row level security;

revoke all on table public.hashcod_platform_registrations from anon, authenticated;
grant select, insert on table public.hashcod_platform_registrations to service_role;

revoke all on sequence public.hashcod_platform_registrations_id_seq from anon, authenticated;
grant usage, select on sequence public.hashcod_platform_registrations_id_seq to service_role;

create index if not exists hashcod_platform_registrations_created_at_idx
  on public.hashcod_platform_registrations (created_at desc);
