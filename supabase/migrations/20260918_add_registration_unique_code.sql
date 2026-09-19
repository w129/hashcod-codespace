begin;

alter table public.hashcod_platform_registrations
  add column if not exists registration_code_enc text not null default '',
  add column if not exists registration_code_sha256 text not null default '',
  add column if not exists registration_code_hint text not null default '';

alter table public.hashcod_platform_registrations
  drop constraint if exists hashcod_platform_registrations_registration_code_enc_check,
  add constraint hashcod_platform_registrations_registration_code_enc_check
    check (registration_code_enc = '' or registration_code_enc like 'l8e1:%'),
  drop constraint if exists hashcod_platform_registrations_registration_code_sha256_check,
  add constraint hashcod_platform_registrations_registration_code_sha256_check
    check (registration_code_sha256 = '' or registration_code_sha256 ~ '^[a-f0-9]{64}$'),
  drop constraint if exists hashcod_platform_registrations_registration_code_hint_check,
  add constraint hashcod_platform_registrations_registration_code_hint_check
    check (char_length(registration_code_hint) <= 8);

create unique index if not exists hashcod_platform_registrations_registration_code_sha256_uidx
  on public.hashcod_platform_registrations (registration_code_sha256)
  where registration_code_sha256 <> '';

comment on column public.hashcod_platform_registrations.registration_code_enc is
  'Encrypted one-time registration code returned in plaintext only in the successful submission response.';
comment on column public.hashcod_platform_registrations.registration_code_sha256 is
  'SHA-256 digest of the registrant code; unique for non-empty values.';
comment on column public.hashcod_platform_registrations.registration_code_hint is
  'Last eight characters of the registration code for administrative correlation without exposing the full plaintext.';

commit;
