-- Per-circle user-defined access signature for Hashcod Secure Toolbox.
-- Only a one-way password hash is stored; plaintext signatures never persist.

begin;

alter table public.hashcod_toolbox_links
  add column if not exists access_signature_hash text not null default '';

alter table public.hashcod_toolbox_links
  drop constraint if exists hashcod_toolbox_links_access_signature_hash_check;

alter table public.hashcod_toolbox_links
  add constraint hashcod_toolbox_links_access_signature_hash_check
  check (char_length(access_signature_hash) <= 255);

commit;
