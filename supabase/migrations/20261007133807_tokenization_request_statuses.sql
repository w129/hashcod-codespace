-- Preserve existing pending requests and the private ledger's RLS/grants.
alter table hashcod_shared.tokenization_requests
  drop constraint tokenization_requests_status_check,
  add constraint tokenization_requests_status_check
    check (status in ('pending', 'in_progress', 'delayed', 'awaiting_payment', 'completed')),
  add column updated_at timestamptz not null default now();
