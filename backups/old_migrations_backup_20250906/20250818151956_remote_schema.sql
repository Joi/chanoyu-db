-- Baseline schema migration
-- Generated from production schema 2025-09-06

-- Extensions
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "pg_net" with schema extensions;

-- Core tables in dependency order

-- Tea schools (must come before accounts due to FK)
create table if not exists tea_schools (
    id uuid primary key default gen_random_uuid(),
    name_en text not null,
    name_ja text,
    created_at timestamptz not null default now()
);

-- Classifications (external standards like AAT, Wikidata)
create table if not exists classifications (
    id uuid primary key default gen_random_uuid(),
    label text not null,
    label_ja text,
    kind text not null,
    scheme text not null,
    uri text,
    created_at timestamptz not null default now()
);

-- Licenses
create table if not exists licenses (
    id uuid primary key default gen_random_uuid(),
    code text not null unique,
    name text not null,
    uri text not null,
    summary text,
    created_at timestamptz not null default now()
);

-- Locations
create table if not exists locations (
    id uuid primary key default gen_random_uuid(),
    local_number text not null unique,
    name text not null,
    address text,
    url text,
    visibility text not null default 'private',
    name_en text,
    name_ja text,
    address_en text,
    address_ja text,
    lat numeric,
    lng numeric,
    google_place_id text,
    google_maps_url text,
    contained_in text,
    contained_in_en text,
    contained_in_ja text,
    token text unique,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Accounts table (after tea_schools due to FK)
create table if not exists accounts (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    full_name_en text,
    full_name_ja text,
    role text not null default 'user',
    password_hash text,
    tea_school_id uuid references tea_schools(id),
    tea_school text,
    tea_school_ja text,
    website text,
    bio text,
    bio_ja text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Objects table (main entity)
create table if not exists objects (
    id uuid primary key default gen_random_uuid(),
    token text not null unique,
    ark_name text,
    naan text,
    local_number text,
    title text,
    title_ja text,
    visibility text not null default 'draft',
    price numeric(18,2),
    tags text[],
    craftsman text,
    event_date text,
    location text,
    notes text,
    store text,
    url text,
    craftsman_ja text,
    location_ja text,
    notes_ja text,
    store_ja text,
    primary_local_class_id uuid,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Media table
create table if not exists media (
    id uuid primary key default gen_random_uuid(),
    object_id uuid references objects(id) on delete cascade,
    kind text not null,
    uri text not null,
    source text,
    width integer,
    height integer,
    license text,
    sort_order integer,
    copyright_owner text,
    rights_note text,
    license_id uuid references licenses(id),
    bucket text,
    storage_path text,
    visibility text not null default 'private',
    local_number text,
    token text unique,
    file_type text,
    file_size bigint,
    original_filename text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Object classifications (many-to-many)
create table if not exists object_classifications (
    object_id uuid not null references objects(id) on delete cascade,
    classification_id uuid not null references classifications(id) on delete cascade,
    role text not null default 'classification',
    primary key (object_id, classification_id)
);

-- Object media links (many-to-many)
create table if not exists object_media_links (
    object_id uuid not null references objects(id) on delete cascade,
    media_id uuid not null references media(id) on delete cascade,
    role text default 'related',
    primary key (object_id, media_id)
);

-- Location media links
create table if not exists location_media_links (
    location_id uuid not null references locations(id) on delete cascade,
    media_id uuid not null references media(id) on delete cascade,
    role text default 'related',
    created_at timestamptz not null default now(),
    primary key (location_id, media_id)
);

-- Valuations
create table if not exists valuations (
    id uuid primary key default gen_random_uuid(),
    object_id uuid not null references objects(id) on delete cascade,
    as_of_date date not null,
    currency text not null,
    amount numeric(18,2) not null,
    source text,
    source_url text,
    visibility text not null default 'private'
);

-- Local counters for ID generation
create table if not exists local_counters (
    kind text not null,
    year integer not null,
    value integer not null,
    primary key (kind, year)
);

-- Redirects for SEO
create table if not exists redirects (
    old_path text primary key,
    new_path text not null
);

-- Indexes for performance
create index if not exists objects_visibility_idx on objects(visibility);
create index if not exists objects_token_idx on objects(token);
create index if not exists objects_local_number_idx on objects(local_number);
create index if not exists media_object_id_idx on media(object_id);
create index if not exists media_visibility_idx on media(visibility);
create index if not exists accounts_email_idx on accounts(email);
create index if not exists classifications_scheme_idx on classifications(scheme);

-- Note: Foreign key constraint for objects.primary_local_class_id will be added in local_classes migration