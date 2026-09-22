-- Hashcod Codespace Resources Index
-- Ejecuta esto en Supabase SQL Editor si quieres guardar el índice en Postgres.

create table if not exists public.resources_index (
  id text primary key,
  name text not null,
  category text default 'General',
  type text default 'file',
  extension text default '',
  size_bytes bigint default 0,
  sha256 text unique,
  original_path text,
  storage_path text,
  url text,
  download_url text,
  mime_type text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists resources_index_category_idx on public.resources_index(category);
create index if not exists resources_index_type_idx on public.resources_index(type);
create index if not exists resources_index_extension_idx on public.resources_index(extension);
create index if not exists resources_index_created_at_idx on public.resources_index(created_at desc);

-- Búsqueda simple por nombre/ruta/descripción.
create extension if not exists pg_trgm;
create index if not exists resources_index_search_idx
  on public.resources_index
  using gin ((coalesce(name,'') || ' ' || coalesce(original_path,'') || ' ' || coalesce(description,'')) gin_trgm_ops);

-- Si el bucket será público:
-- insert into storage.buckets (id, name, public)
-- values ('hashcod-resources', 'hashcod-resources', true)
-- on conflict (id) do update set public = excluded.public;
