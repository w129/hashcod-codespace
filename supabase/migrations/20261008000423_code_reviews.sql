-- Review records remain private. Only the signed backend bridge can access them.
alter table hashcod_shared.tokenization_requests drop constraint if exists tokenization_requests_status_check;
alter table hashcod_shared.tokenization_requests add constraint tokenization_requests_status_check
  check (status in ('pending','in_progress','delayed','awaiting_payment','completed','under_review','certified','rejected'));
create table hashcod_shared.review_keyring (
  id text primary key, public_key text not null, revoked boolean not null default false,
  created_at timestamptz not null default now()
);
create table hashcod_shared.review_nonces (
  key_id text not null references hashcod_shared.review_keyring(id), nonce text not null,
  created_at timestamptz not null default now(), primary key(key_id, nonce)
);
create index review_nonces_cleanup on hashcod_shared.review_nonces(created_at);
create table hashcod_shared.review_sessions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references hashcod_shared.tokenization_requests(id),
  period_id uuid not null references hashcod_shared.access_periods(id),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{128}$'),
  language text not null check (language in ('python','javascript')),
  model text not null check(model in ('claude-sonnet-5-5','claude-opus-5-5')),
  status text not null default 'active' check(status in ('active','pass','fail','needs_human','stale','closed')),
  budget_micros bigint not null check(budget_micros between 100000 and 20000000),
  reserved_micros bigint not null default 0 check(reserved_micros >= 0),
  created_at timestamptz not null default now(), expires_at timestamptz not null default now() + interval '30 minutes',
  updated_at timestamptz not null default now()
);
create index review_sessions_owner on hashcod_shared.review_sessions(period_id, created_at desc);
create index review_sessions_request on hashcod_shared.review_sessions(request_id, created_at desc);
create unique index review_sessions_active on hashcod_shared.review_sessions(request_id) where status='active';
create table hashcod_shared.review_messages (
  id bigint generated always as identity primary key, session_id uuid not null references hashcod_shared.review_sessions(id),
  role text not null check(role in ('user','assistant')), body text not null check(length(body)<=20000),
  created_at timestamptz not null default now()
);
create index review_messages_session on hashcod_shared.review_messages(session_id,id);
create table hashcod_shared.review_checks (
  session_id uuid primary key references hashcod_shared.review_sessions(id),
  attestation jsonb not null, checks jsonb not null, created_at timestamptz not null default now()
);
create table hashcod_shared.certificates (
  id uuid primary key, session_id uuid unique not null references hashcod_shared.review_sessions(id),
  request_id uuid not null references hashcod_shared.tokenization_requests(id),
  payload jsonb not null, signature text not null, key_id text not null references hashcod_shared.review_keyring(id),
  revoked_at timestamptz, revocation_reason text check(length(revocation_reason)<=500),
  created_at timestamptz not null default now()
);
create index certificates_request on hashcod_shared.certificates(request_id,created_at desc);
do $$ declare t text; begin
  foreach t in array array['review_keyring','review_nonces','review_sessions','review_messages','review_checks','certificates'] loop
    execute format('alter table hashcod_shared.%I enable row level security',t);
    execute format('revoke all on hashcod_shared.%I from public, anon, authenticated',t);
  end loop;
end $$;
revoke all on sequence hashcod_shared.review_messages_id_seq from public, anon, authenticated;
