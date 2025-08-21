-- Base schema to ensure core tables exist (idempotent)
-- Extracted from supabase/sql/init.sql with guards

-- Objects
create table if not exists objects (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  ark_name text,
  local_number text,
  title text not null,
  title_ja text,
  summary text,
  summary_ja text,
  price numeric(12,2),
  visibility text not null default 'public' check (visibility in ('public','private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Classifications
create table if not exists classifications (
  id uuid primary key default gen_random_uuid(),
  scheme text not null,
  uri text unique not null,
  label text,
  label_ja text,
  kind text
);

-- Object ↔ Classifications
create table if not exists object_classifications (
  object_id uuid references objects(id) on delete cascade,
  classification_id uuid references classifications(id) on delete cascade,
  role text not null,
  primary key (object_id, classification_id, role)
);

-- Licenses
create table if not exists licenses (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  uri text not null,
  summary text
);

-- Media
create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  object_id uuid references objects(id) on delete set null,
  kind text,
  uri text not null,
  copyright_owner text,
  rights_note text,
  license_id uuid references licenses(id),
  license text,
  sort_order int
);

-- Tea schools
create table if not exists tea_schools (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ja text
);

-- Accounts (if missing)
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name_en text,
  full_name_ja text,
  role text not null check (role in ('owner','admin','guest')),
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- RLS
alter table objects enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'objects' and policyname = 'objects_public_read'
  ) then
    create policy objects_public_read on objects for select using (visibility = 'public');
  end if;
end $$;

alter table classifications enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'classifications' and policyname = 'classifications_public_read'
  ) then
    create policy classifications_public_read on classifications for select using (true);
  end if;
end $$;

alter table object_classifications enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'object_classifications' and policyname = 'oc_public_read'
  ) then
    create policy oc_public_read on object_classifications for select using (
      exists (select 1 from objects o where o.id = object_id and o.visibility = 'public')
    );
  end if;
end $$;

alter table media enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'media' and policyname = 'media_public_read'
  ) then
    create policy media_public_read on media for select using (
      exists (select 1 from objects o where o.id = object_id and o.visibility = 'public')
    );
  end if;
end $$;

alter table licenses enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'licenses' and policyname = 'licenses_public_read'
  ) then
    create policy licenses_public_read on licenses for select using (true);
  end if;
end $$;

alter table accounts enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'accounts' and policyname = 'accounts_read_owner_only'
  ) then
    create policy accounts_read_owner_only on accounts for select using (false);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'accounts' and policyname = 'accounts_write_owner_only'
  ) then
    create policy accounts_write_owner_only on accounts for all using (false) with check (false);
  end if;
end $$;

-- Extend objects (idempotent)
alter table objects add column if not exists tags text[];
alter table objects add column if not exists craftsman text;
alter table objects add column if not exists craftsman_ja text;
alter table objects add column if not exists event_date date;
alter table objects add column if not exists location text;
alter table objects add column if not exists location_ja text;
alter table objects add column if not exists notes text;
alter table objects add column if not exists notes_ja text;
alter table objects add column if not exists store text;
alter table objects add column if not exists store_ja text;
alter table objects add column if not exists url text;

-- Media storage controls (idempotent)
alter table media add column if not exists bucket text default 'media';
alter table media add column if not exists storage_path text;
alter table media add column if not exists visibility text default 'public' check (visibility in ('public','private'));
alter table media add column if not exists local_number text;
alter table media add column if not exists created_at timestamptz not null default now();
alter table media add column if not exists token text;

-- Uniqueness
create unique index if not exists objects_local_number_ci on objects (lower(local_number)) where local_number is not null;
create unique index if not exists media_local_number_ci on media (lower(local_number)) where local_number is not null;
create unique index if not exists media_token_unique on media (token) where token is not null;

-- Media auto local number
create sequence if not exists media_local_seq;
create or replace function set_media_local_number() returns trigger as $$
begin
  if new.local_number is null then
    new.local_number := 'ITO-M-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('media_local_seq')::text, 5, '0');
  end if;
  return new;
end;
$$ language plpgsql;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_media_local_number'
  ) then
    create trigger trg_media_local_number
      before insert on media
      for each row execute function set_media_local_number();
  end if;
end $$;

-- Locations
create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  url text,
  local_number text,
  visibility text not null default 'public' check (visibility in ('public','private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists locations_local_number_ci on locations (lower(local_number)) where local_number is not null;
alter table locations add column if not exists token text;
create unique index if not exists locations_token_unique on locations (token) where token is not null;
alter table locations enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'locations' and policyname = 'locations_public_read'
  ) then
    create policy locations_public_read on locations for select using (visibility = 'public');
  end if;
end $$;

-- Bilingual location columns
alter table locations add column if not exists name_en text;
alter table locations add column if not exists name_ja text;
alter table locations add column if not exists address_en text;
alter table locations add column if not exists address_ja text;
alter table locations add column if not exists lat double precision;
alter table locations add column if not exists lng double precision;
alter table locations add column if not exists google_place_id text;
alter table locations add column if not exists google_maps_url text;
alter table locations add column if not exists contained_in text;
alter table locations add column if not exists contained_in_en text;
alter table locations add column if not exists contained_in_ja text;

-- Many-to-many location/media
create table if not exists location_media_links (
  location_id uuid references locations(id) on delete cascade,
  media_id uuid references media(id) on delete cascade,
  role text default 'related',
  created_at timestamptz not null default now(),
  primary key (location_id, media_id)
);
create index if not exists lml_media_idx on location_media_links(media_id);

-- Many-to-many object/media
create table if not exists object_media_links (
  object_id uuid references objects(id) on delete cascade,
  media_id uuid references media(id) on delete cascade,
  role text default 'related',
  created_at timestamptz not null default now(),
  primary key (object_id, media_id)
);
create index if not exists oml_media_idx on object_media_links(media_id);


