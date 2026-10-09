-- No existing technical session is proof of payment; all begin as free.
create table hashcod_shared.subscriptions (
  period_id uuid primary key,
  plan text not null check(plan in ('monthly','yearly')),
  expires_at timestamptz not null
);
create table hashcod_shared.subscription_codes (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null,
  code_hash text not null check(code_hash ~ '^[a-f0-9]{64}$'),
  plan text not null check(plan in ('monthly','yearly')),
  issued_by uuid not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz
);
create unique index subscription_live_code on hashcod_shared.subscription_codes(period_id) where consumed_at is null;
create index subscription_code_lookup on hashcod_shared.subscription_codes(period_id,code_hash);
create index tokenization_monthly_quota on hashcod_shared.tokenization_requests(period_id,created_at);
alter table hashcod_shared.subscriptions enable row level security;
alter table hashcod_shared.subscription_codes enable row level security;
revoke all on hashcod_shared.subscriptions, hashcod_shared.subscription_codes from public,anon,authenticated;
