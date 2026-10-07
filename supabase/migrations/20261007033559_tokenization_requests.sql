-- Private queue: no contact information or authentication material is public.
create table hashcod_shared.tokenization_config (
  id smallint primary key check (id = 1),
  admin_hash text not null check (admin_hash ~ '^[a-f0-9]{64}$'),
  revision uuid not null default gen_random_uuid()
);
create table hashcod_shared.tokenization_requests (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references hashcod_shared.access_periods(id),
  file_id text not null,
  file_name text not null,
  mime text not null,
  size bigint not null check (size >= 0),
  price_usd_cents bigint,
  phone text not null check (length(phone) between 7 and 32),
  email text not null check (length(email) between 3 and 254),
  status text not null default 'pending' check (status = 'pending'),
  created_at timestamptz not null default now(),
  unique (period_id, file_id)
);
-- Snapshot metadata survives removal of the original file; its code is never copied.
create index tokenization_requests_queue_idx on hashcod_shared.tokenization_requests(created_at desc, id desc);
alter table hashcod_shared.tokenization_config enable row level security;
alter table hashcod_shared.tokenization_requests enable row level security;
revoke all on hashcod_shared.tokenization_config, hashcod_shared.tokenization_requests from public, anon, authenticated;
