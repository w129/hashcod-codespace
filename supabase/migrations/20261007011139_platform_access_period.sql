-- Private access ledger. No renewal credentials belong in this migration.
create table if not exists hashcod_shared.access_period_config (
  id integer primary key check (id = 1),
  renewal_hash text not null check (renewal_hash ~ '^[a-f0-9]{64}$')
);
create table if not exists hashcod_shared.access_periods (
  id uuid primary key,
  days integer not null check (days in (10, 20, 30, 60)),
  expires_at bigint not null check (expires_at > 0)
);
alter table hashcod_shared.access_period_config enable row level security;
alter table hashcod_shared.access_periods enable row level security;
revoke all on hashcod_shared.access_period_config, hashcod_shared.access_periods from public, anon, authenticated;
