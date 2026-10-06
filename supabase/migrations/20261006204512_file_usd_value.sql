-- Optional uploader-assigned USD value; cents preserve exact decimal amounts.
-- Existing files remain unpriced and existing RLS/grants remain in force.
alter table hashcod_shared.files
  add column if not exists price_usd_cents integer
  check (price_usd_cents between 0 and 999999999);
