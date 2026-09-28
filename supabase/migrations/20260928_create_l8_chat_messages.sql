-- Hashcod saved comments
-- Adapts the room/message data model from aws-samples/appsync-chat-app-cdk
-- to the existing Hashcod server-side Supabase/Postgres backend.

create table if not exists public.l8_chat_messages (
  id text primary key,
  room_id text not null default 'hashcod-gate-comments',
  owner_key text not null,
  content text not null,
  client_nonce text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint l8_chat_messages_content_len check (char_length(content) between 1 and 1200),
  constraint l8_chat_messages_room_len check (char_length(room_id) between 1 and 80),
  constraint l8_chat_messages_owner_len check (char_length(owner_key) between 1 and 160)
);

create unique index if not exists l8_chat_messages_room_owner_nonce_uq
  on public.l8_chat_messages(room_id, owner_key, client_nonce);

create index if not exists l8_chat_messages_room_created_idx
  on public.l8_chat_messages(room_id, created_at asc);

alter table public.l8_chat_messages enable row level security;

revoke all on table public.l8_chat_messages from anon, authenticated;
grant select, insert, update, delete on table public.l8_chat_messages to service_role;

drop policy if exists "deny anon l8_chat_messages" on public.l8_chat_messages;
drop policy if exists "deny authenticated l8_chat_messages" on public.l8_chat_messages;

create policy "deny anon l8_chat_messages"
  on public.l8_chat_messages for all to anon
  using (false) with check (false);

create policy "deny authenticated l8_chat_messages"
  on public.l8_chat_messages for all to authenticated
  using (false) with check (false);
