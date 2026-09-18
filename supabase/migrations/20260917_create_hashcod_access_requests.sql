-- Hashcod Codespace final-entry registration form
-- Server-side only. Sensitive fields are encrypted by PHP before persistence.

begin;

create table if not exists public.hashcod_access_requests (
  id uuid primary key default gen_random_uuid(),
  full_name_enc text not null check (char_length(full_name_enc) between 16 and 8192),
  age smallint not null check (age between 18 and 120),
  cedula_enc text not null check (char_length(cedula_enc) between 16 and 8192),
  platform_name text not null check (char_length(platform_name) between 2 and 120),
  email_enc text not null check (char_length(email_enc) between 16 and 8192),
  phone_enc text not null check (char_length(phone_enc) between 16 and 8192),
  source text not null default 'final_entry_form'
    check (source in ('final_entry_form')),
  submitted_at timestamptz not null default now()
);

create index if not exists hashcod_access_requests_submitted_idx
  on public.hashcod_access_requests (submitted_at desc);

alter table public.hashcod_access_requests enable row level security;

revoke all on table public.hashcod_access_requests from public, anon, authenticated;
grant select, insert on table public.hashcod_access_requests to service_role;

drop policy if exists hashcod_access_requests_deny_public
  on public.hashcod_access_requests;
create policy hashcod_access_requests_deny_public
  on public.hashcod_access_requests
  for all
  to public
  using (false)
  with check (false);

comment on table public.hashcod_access_requests is
  'Adult-only final-entry registration submissions. PII is encrypted application-side; access is server/admin only.';

commit;
