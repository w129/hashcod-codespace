-- Hashcod Codespace: secure links for the 4x4 Toolbox circles.
-- URLs and identity metadata remain server-side until the configured
-- Dilithium-5 credential is validated by toolbox-secure.php.

begin;

create table if not exists public.hashcod_toolbox_links (
  slot_key text primary key check (slot_key ~ '^[1-4]-[1-4]$'),
  url text not null check (char_length(url) between 1 and 4096),
  icon_svg text not null check (char_length(icon_svg) between 1 and 32768),
  label text not null default '' check (char_length(label) <= 120),
  identity_id uuid not null default gen_random_uuid(),
  identity_name text not null default '' check (char_length(identity_name) <= 120),
  identity_username text not null default '' check (char_length(identity_username) <= 120),
  identity_email text not null default '' check (char_length(identity_email) <= 254),
  is_deleted boolean not null default false,
  created_at_ms bigint not null check (created_at_ms > 0),
  updated_at_ms bigint not null check (updated_at_ms >= created_at_ms),
  updated_by text not null default 'platform',
  updated_at timestamptz not null default now()
);

create index if not exists hashcod_toolbox_links_live_idx
  on public.hashcod_toolbox_links (is_deleted, updated_at_ms desc);

alter table public.hashcod_toolbox_links enable row level security;
drop policy if exists hashcod_toolbox_links_server_only on public.hashcod_toolbox_links;
create policy hashcod_toolbox_links_server_only on public.hashcod_toolbox_links
  for all to public using (false) with check (false);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'hashcod_toolbox_links'
  ) then
    alter publication supabase_realtime add table public.hashcod_toolbox_links;
  end if;
end $$;

commit;
