-- Schema for Ito Collection
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

create table if not exists classifications (
  id uuid primary key default gen_random_uuid(),
  scheme text not null,
  uri text unique not null,
  label text,
  label_ja text,
  kind text
);

create table if not exists object_classifications (
  object_id uuid references objects(id) on delete cascade,
  classification_id uuid references classifications(id) on delete cascade,
  role text not null,
  primary key (object_id, classification_id, role)
);

-- Licenses (e.g., creative commons)
create table if not exists licenses (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  uri text not null,
  summary text
);

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

-- Tea schools (authority for member affiliations)
create table if not exists tea_schools (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ja text
);

alter table accounts add column if not exists tea_school_id uuid references tea_schools(id);

alter table tea_schools enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'tea_schools' and policyname = 'tea_schools_public_read'
  ) then
    create policy tea_schools_public_read on tea_schools for select using (true);
  end if;
end $$;

-- Optional: backfill media.local_number for existing rows missing it
do $$ begin
  update media
  set local_number = 'ITO-M-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('media_local_seq')::text, 5, '0')
  where local_number is null;
exception when others then
  null;
end $$;

-- Simple accounts table managed by owner via admin UI
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name_en text,
  full_name_ja text,
  role text not null check (role in ('owner','admin','guest')),
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- Basic RLS (adapt to your project needs)
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

-- Note: We enforce account and price visibility at the API level (server routes)

-- Extend objects with editorial and commerce fields (idempotent)
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

-- Extend accounts with optional member profile fields (idempotent)
alter table accounts add column if not exists tea_school text;
alter table accounts add column if not exists tea_school_ja text;
alter table accounts add column if not exists website text;
alter table accounts add column if not exists bio text;
alter table accounts add column if not exists bio_ja text;

-- Extend media for storage controls (idempotent)
alter table media add column if not exists bucket text default 'media';
alter table media add column if not exists storage_path text; -- e.g., media/<object_id>/<filename>
alter table media add column if not exists visibility text default 'public' check (visibility in ('public','private'));
alter table media add column if not exists local_number text; -- e.g., ITO-YYYY-M-NNNNN
alter table media add column if not exists created_at timestamptz not null default now();
alter table media add column if not exists token text;

-- Uniqueness for human IDs (case-insensitive) when present
create unique index if not exists objects_local_number_ci on objects (lower(local_number)) where local_number is not null;
create unique index if not exists media_local_number_ci on media (lower(local_number)) where local_number is not null;
create unique index if not exists media_token_unique on media (token) where token is not null;

-- Auto-generate local_number for media if missing (idempotent)
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

-- Many-to-many linkage between objects and media (optional; supports multi-item media)
create table if not exists object_media_links (
  object_id uuid references objects(id) on delete cascade,
  media_id uuid references media(id) on delete cascade,
  role text default 'related',
  created_at timestamptz not null default now(),
  primary key (object_id, media_id)
);
create index if not exists oml_media_idx on object_media_links(media_id);

-- Tea rooms (locations)
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

-- Bilingual columns for tea rooms (idempotent)
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

-- Many-to-many linkage between locations and media (supports multi-location media)
create table if not exists location_media_links (
  location_id uuid references locations(id) on delete cascade,
  media_id uuid references media(id) on delete cascade,
  role text default 'related',
  created_at timestamptz not null default now(),
  primary key (location_id, media_id)
);
create index if not exists lml_media_idx on location_media_links(media_id);

-- Allow public read of media when linked to public locations (in addition to objects policy)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'media' and policyname = 'media_public_read_locations'
  ) then
    create policy media_public_read_locations on media for select using (
      exists (
        select 1 from location_media_links lml
        join locations l on l.id = lml.location_id
        where lml.media_id = id and l.visibility = 'public'
      )
    );
  end if;
end $$;

-- Chakai tokens and indexes (idempotent, guarded if table exists)
do $$ begin
  if exists (
    select 1 from information_schema.tables where table_schema = 'public' and table_name = 'chakai'
  ) then
    -- token column
    begin
      alter table if exists chakai add column if not exists token text;
    exception when others then
      null;
    end;
    -- local_number unique (case-insensitive)
    begin
      create unique index if not exists chakai_local_number_ci on chakai (lower(local_number)) where local_number is not null;
    exception when others then
      null;
    end;
    -- token unique
    begin
      create unique index if not exists chakai_token_unique on chakai (token) where token is not null;
    exception when others then
      null;
    end;
  end if;
end $$;
