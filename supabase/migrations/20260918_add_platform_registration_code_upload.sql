begin;

alter table public.hashcod_platform_registrations
  add column if not exists code_filename text not null default '',
  add column if not exists code_mime_type text not null default 'application/octet-stream',
  add column if not exists code_size_bytes bigint not null default 0,
  add column if not exists code_sha256 text not null default '',
  add column if not exists code_storage_path text not null default '';

alter table public.hashcod_platform_registrations
  drop constraint if exists hashcod_platform_registrations_code_filename_check,
  add constraint hashcod_platform_registrations_code_filename_check
    check (char_length(code_filename) <= 255),
  drop constraint if exists hashcod_platform_registrations_code_size_check,
  add constraint hashcod_platform_registrations_code_size_check
    check (code_size_bytes between 0 and 10485760),
  drop constraint if exists hashcod_platform_registrations_code_sha256_check,
  add constraint hashcod_platform_registrations_code_sha256_check
    check (code_sha256 = '' or code_sha256 ~ '^[a-f0-9]{64}$');

comment on column public.hashcod_platform_registrations.code_storage_path is
  'Private Supabase Storage object containing the uploaded platform source-code package.';

commit;
