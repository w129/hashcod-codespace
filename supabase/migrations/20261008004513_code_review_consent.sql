alter table hashcod_shared.review_sessions
  add column consented_at timestamptz not null default now(),
  add column policy_version text not null default '2026.10.08-1';
