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

-- Simple accounts table managed by owner via admin UI
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name_en text,
  full_name_ja text,
  tea_school_id uuid references tea_schools(id),
  role text not null check (role in ('owner','admin','guest')),
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- Basic RLS (adapt to your project needs)
alter table objects enable row level security;
create policy objects_public_read on objects for select using (visibility = 'public');

alter table classifications enable row level security;
create policy classifications_public_read on classifications for select using (true);

alter table object_classifications enable row level security;
create policy oc_public_read on object_classifications for select using (
  exists (select 1 from objects o where o.id = object_id and o.visibility = 'public')
);

alter table media enable row level security;
create policy media_public_read on media for select using (
  exists (select 1 from objects o where o.id = object_id and o.visibility = 'public')
);

alter table licenses enable row level security;
create policy licenses_public_read on licenses for select using (true);

alter table accounts enable row level security;
create policy accounts_read_owner_only on accounts for select using (false);
create policy accounts_write_owner_only on accounts for all using (false) with check (false);

-- Note: We enforce account and price visibility at the API level (server routes)
-- Tea schools
create table if not exists tea_schools (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ja text
);

alter table tea_schools enable row level security;
create policy tea_schools_public_read on tea_schools for select using (true);

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

-- Extend media for storage controls (idempotent)
alter table media add column if not exists bucket text default 'media';
alter table media add column if not exists storage_path text; -- e.g., media/<object_id>/<filename>
alter table media add column if not exists visibility text default 'public' check (visibility in ('public','private'));
alter table media add column if not exists local_number text; -- e.g., ITO-YYYY-M-NNNNN
alter table media add column if not exists created_at timestamptz not null default now();

-- Uniqueness for human IDs (case-insensitive) when present
create unique index if not exists objects_local_number_ci on objects (lower(local_number)) where local_number is not null;
create unique index if not exists media_local_number_ci on media (lower(local_number)) where local_number is not null;

-- Many-to-many linkage between objects and media (optional; supports multi-item media)
create table if not exists object_media_links (
  object_id uuid references objects(id) on delete cascade,
  media_id uuid references media(id) on delete cascade,
  role text default 'related',
  created_at timestamptz not null default now(),
  primary key (object_id, media_id)
);
create index if not exists oml_media_idx on object_media_links(media_id);
