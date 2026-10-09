-- Append-only evidence that a visitor accepted the Use and Privacy Policy.
-- Only salted hashes are kept: no IP address or user-agent text is stored.
create table hashcod_shared.policy_consents (
  id uuid primary key default gen_random_uuid(),
  policy_version text not null check (policy_version ~ '^[0-9][0-9.\-]{0,38}$'),
  accepted_at timestamptz not null default now(),
  client_hash text not null check (client_hash ~ '^[a-f0-9]{64}$'),
  agent_hash text not null check (agent_hash ~ '^[a-f0-9]{32,64}$'),
  host text not null check (length(host) between 1 and 255)
);
create index policy_consents_accepted_idx on hashcod_shared.policy_consents(accepted_at desc, id desc);

-- Evidence must never be edited or erased through the application or the API roles.
create function hashcod_shared.policy_consents_immutable() returns trigger
language plpgsql as $$
begin
  raise exception 'policy_consents is append-only' using errcode = '42501';
end;
$$;
create trigger policy_consents_no_change
  before update or delete on hashcod_shared.policy_consents
  for each row execute function hashcod_shared.policy_consents_immutable();
create trigger policy_consents_no_truncate
  before truncate on hashcod_shared.policy_consents
  for each statement execute function hashcod_shared.policy_consents_immutable();

alter table hashcod_shared.policy_consents enable row level security;
revoke all on hashcod_shared.policy_consents from public, anon, authenticated;
