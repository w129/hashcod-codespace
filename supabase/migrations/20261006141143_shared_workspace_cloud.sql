-- Separate shared-product scope; existing private account/admin tables remain
-- unchanged. Only the bounded Edge facade may access these records.
create schema if not exists hashcod_shared;
revoke all on schema hashcod_shared from public, anon, authenticated;
grant usage on schema hashcod_shared to service_role;
create sequence hashcod_shared.entry_revision;
create table hashcod_shared.entries (
  key text primary key check (length(key) <= 180),
  value text not null check (octet_length(value) <= 524288),
  client_updated_at bigint not null check (client_updated_at > 0),
  deleted boolean not null default false,
  revision bigint not null default nextval('hashcod_shared.entry_revision')
);
create table hashcod_shared.files (
  id text primary key check (id ~ '^fv_[A-Za-z0-9_-]{8,64}$'),
  name text not null check (length(name) <= 220),
  mime text not null check (length(mime) <= 160),
  size bigint not null check (size between 0 and 99614720),
  object_path text not null unique,
  code_hash text not null check (code_hash ~ '^[a-f0-9]{64}$'),
  status text not null check (status in ('pending','ready','deleted')),
  created_at timestamptz not null default now()
);
create index shared_files_status_created on hashcod_shared.files (status, created_at desc);
create table hashcod_shared.rate_limits (
  key text primary key check (length(key) <= 180),
  started timestamptz not null,
  attempts integer not null check (attempts > 0)
);
alter table hashcod_shared.entries enable row level security;
alter table hashcod_shared.files enable row level security;
alter table hashcod_shared.rate_limits enable row level security;
revoke all on all tables in schema hashcod_shared from public, anon, authenticated;
revoke all on all sequences in schema hashcod_shared from public, anon, authenticated;
grant all on all tables in schema hashcod_shared to service_role;
grant usage, select on all sequences in schema hashcod_shared to service_role;
