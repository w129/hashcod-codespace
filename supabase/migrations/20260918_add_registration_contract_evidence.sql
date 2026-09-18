begin;

alter table public.hashcod_platform_registrations
  add column if not exists contract_version text not null default '',
  add column if not exists contract_sha256 text not null default '',
  add column if not exists contract_accepted_at timestamptz,
  add column if not exists acceptance_method text not null default '',
  add column if not exists acceptance_evidence_sha256 text not null default '';

alter table public.hashcod_platform_registrations
  drop constraint if exists hashcod_platform_registrations_contract_sha256_check,
  add constraint hashcod_platform_registrations_contract_sha256_check
    check (contract_sha256 = '' or contract_sha256 ~ '^[a-f0-9]{64}$'),
  drop constraint if exists hashcod_platform_registrations_acceptance_evidence_sha256_check,
  add constraint hashcod_platform_registrations_acceptance_evidence_sha256_check
    check (acceptance_evidence_sha256 = '' or acceptance_evidence_sha256 ~ '^[a-f0-9]{64}$');

comment on column public.hashcod_platform_registrations.contract_sha256 is
  'SHA-256 of the canonical contractual text accepted by the registrant.';
comment on column public.hashcod_platform_registrations.acceptance_evidence_sha256 is
  'SHA-256 evidence digest binding contract version, acceptance timestamp, platform, age and uploaded-code hash.';

commit;
