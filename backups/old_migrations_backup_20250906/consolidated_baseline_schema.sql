-- Consolidated Baseline Schema Migration
-- Generated: 2025-09-06
-- Description: Complete database schema consolidation from existing migrations
-- This replaces all previous individual migration files

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

-- Local Classes (Metaclassification) 
create sequence if not exists local_class_local_seq;

create table if not exists local_classes (
    id uuid primary key default gen_random_uuid(),
    token text unique,
    local_number text unique,
    label_en text,
    label_ja text,
    description text,
    parent_id uuid,
    preferred_classification_id uuid,
    status text not null default 'active' check (status in ('active', 'draft', 'deprecated')),
    sort_order integer,
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

-- Chakai (tea gatherings)
create table if not exists chakai (
    id uuid primary key default gen_random_uuid(),
    local_number text not null,
    event_date date not null,
    start_time time without time zone,
    location_id uuid,
    visibility text not null,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    name_en text,
    name_ja text,
    token text
);

-- Relationship tables (many-to-many)

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

-- Chakai attendees (many-to-many between chakai and accounts)
create table if not exists chakai_attendees (
    chakai_id uuid not null references chakai(id) on delete cascade,
    account_id uuid not null references accounts(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (chakai_id, account_id)
);

-- Chakai media links
create table if not exists chakai_media_links (
    chakai_id uuid not null references chakai(id) on delete cascade,
    media_id uuid not null references media(id) on delete cascade,
    role text default 'attachment',
    created_at timestamptz not null default now(),
    primary key (chakai_id, media_id)
);

-- Chakai items (links chakai to objects used)
create table if not exists chakai_items (
    chakai_id uuid not null references chakai(id) on delete cascade,
    object_id uuid not null references objects(id) on delete cascade,
    role text default 'used',
    created_at timestamptz not null default now(),
    primary key (chakai_id, object_id)
);

-- Local class hierarchy (closure table)
create table if not exists local_class_hierarchy (
    ancestor_id uuid references local_classes(id) on delete cascade,
    descendant_id uuid references local_classes(id) on delete cascade,
    depth int not null,
    primary key (ancestor_id, descendant_id)
);

-- Local class links (many-to-many between local_classes and classifications)
create table if not exists local_class_links (
    local_class_id uuid not null references local_classes(id) on delete cascade,
    classification_id uuid not null references classifications(id) on delete cascade,
    role text not null default 'narrower',
    primary key (local_class_id, classification_id)
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

-- Add foreign key constraint for objects.primary_local_class_id
do $$ begin 
    if not exists (
        select 1 from information_schema.table_constraints
        where constraint_name = 'objects_primary_local_class_id_fkey'
    ) then 
        alter table objects add constraint objects_primary_local_class_id_fkey 
        foreign key (primary_local_class_id) references local_classes(id) on delete set null;
    end if;
end $$;

-- Add foreign key constraint for chakai.location_id
do $$ begin 
    if not exists (
        select 1 from information_schema.table_constraints
        where constraint_name = 'chakai_location_id_fkey'
    ) then 
        alter table chakai add constraint chakai_location_id_fkey 
        foreign key (location_id) references locations(id) on delete cascade;
    end if;
end $$;

-- Add foreign key constraint for local_classes.parent_id (self-reference)
do $$ begin 
    if not exists (
        select 1 from information_schema.table_constraints
        where constraint_name = 'local_classes_parent_id_fkey'
    ) then 
        alter table local_classes add constraint local_classes_parent_id_fkey 
        foreign key (parent_id) references local_classes(id) on delete cascade;
    end if;
end $$;

-- Add foreign key constraint for local_classes.preferred_classification_id
do $$ begin 
    if not exists (
        select 1 from information_schema.table_constraints
        where constraint_name = 'local_classes_preferred_classification_id_fkey'
    ) then 
        alter table local_classes add constraint local_classes_preferred_classification_id_fkey 
        foreign key (preferred_classification_id) references classifications(id) on delete set null;
    end if;
end $$;

-- Indexes for performance
create index if not exists objects_visibility_idx on objects(visibility);
create index if not exists objects_token_idx on objects(token);
create index if not exists objects_local_number_idx on objects(local_number);
create index if not exists media_object_id_idx on media(object_id);
create index if not exists media_visibility_idx on media(visibility);
create index if not exists accounts_email_idx on accounts(email);
create index if not exists classifications_scheme_idx on classifications(scheme);
create index if not exists local_classes_parent_idx on local_classes(parent_id);
create index if not exists local_classes_sort_order_idx on local_classes(sort_order NULLS LAST, local_number);
create index if not exists local_classes_local_number_ci on local_classes (lower(local_number)) where local_number is not null;
create index if not exists chakai_items_chakai_idx on chakai_items(chakai_id);
create index if not exists chakai_items_object_idx on chakai_items(object_id);
create index if not exists cml_media_idx on chakai_media_links(media_id);
create index if not exists cml_chakai_idx on chakai_media_links(chakai_id);
create unique index if not exists chakai_local_number_key on chakai (local_number);
create unique index if not exists chakai_token_unique on chakai (token);
create index if not exists idx_chakai_event_date on chakai (event_date);
create index if not exists idx_chakai_visibility on chakai (visibility);

-- Functions
create or replace function set_local_class_local_number() returns trigger as $$ 
begin 
    if new.local_number is null then 
        new.local_number := 'ITO-C-' || lpad(nextval('local_class_local_seq')::text, 5, '0');
    end if;
    return new;
end;
$$ language plpgsql security definer set search_path = '';

create or replace function lc_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    -- Update sort_order for new local_classes entries
    update public.local_classes 
    set sort_order = (
        select coalesce(max(sort_order), 0) + 1 
        from public.local_classes 
        where parent_id = new.parent_id
    )
    where id = new.id and sort_order is null;
    
    return new;
end;
$$;

create or replace function lc_before_update_parent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    -- Handle parent_id changes in local_classes
    if old.parent_id != new.parent_id then
        -- Reset sort_order when parent changes
        new.sort_order := null;
    end if;
    
    return new;
end;
$$;

create or replace function set_local_class_local_number(class_id integer, new_local_number text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    update public.local_classes 
    set local_number = new_local_number 
    where id = class_id;
end;
$$;

create or replace function swap_local_class_sort_order(item1_id integer, item2_id integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    item1_order integer;
    item2_order integer;
begin
    -- Get current sort_order values
    select sort_order into item1_order from public.local_classes where id = item1_id;
    select sort_order into item2_order from public.local_classes where id = item2_id;
    
    -- Swap the sort_order values
    update public.local_classes set sort_order = item2_order where id = item1_id;
    update public.local_classes set sort_order = item1_order where id = item2_id;
end;
$$;

create or replace function swap_local_class_sort_order(class_id_1 uuid, class_id_2 uuid)
returns table(success boolean, error_message text, class1_old_sort integer, class1_new_sort integer, class2_old_sort integer, class2_new_sort integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
    item1_order integer;
    item2_order integer;
begin
    -- Get current sort_order values
    select sort_order into item1_order from public.local_classes where id = class_id_1;
    select sort_order into item2_order from public.local_classes where id = class_id_2;
    
    -- Swap the sort_order values
    update public.local_classes set sort_order = item2_order where id = class_id_1;
    update public.local_classes set sort_order = item1_order where id = class_id_2;
    
    -- Return success information
    return query select true, null::text, item1_order, item2_order, item2_order, item1_order;
end;
$$;

-- Triggers
do $$ begin 
    if not exists (
        select 1
        from pg_trigger
        where tgname = 'trg_local_class_local_number'
    ) then 
        create trigger trg_local_class_local_number before
        insert on local_classes for each row execute function set_local_class_local_number();
    end if;
end $$;

do $$ begin 
    if not exists (
        select 1
        from pg_trigger
        where tgname = 'lc_after_insert_trigger'
    ) then 
        create trigger lc_after_insert_trigger after
        insert on local_classes for each row execute function lc_after_insert();
    end if;
end $$;

do $$ begin 
    if not exists (
        select 1
        from pg_trigger
        where tgname = 'lc_before_update_parent_trigger'
    ) then 
        create trigger lc_before_update_parent_trigger before
        update on local_classes for each row execute function lc_before_update_parent();
    end if;
end $$;

-- Enable RLS on all tables
alter table accounts enable row level security;
alter table chakai enable row level security;
alter table chakai_attendees enable row level security;
alter table chakai_items enable row level security;
alter table chakai_media_links enable row level security;
alter table classifications enable row level security;
alter table licenses enable row level security;
alter table local_class_hierarchy enable row level security;
alter table local_class_links enable row level security;
alter table local_classes enable row level security;
alter table local_counters enable row level security;
alter table location_media_links enable row level security;
alter table locations enable row level security;
alter table media enable row level security;
alter table object_classifications enable row level security;
alter table object_media_links enable row level security;
alter table objects enable row level security;
alter table redirects enable row level security;
alter table tea_schools enable row level security;
alter table valuations enable row level security;

-- RLS Policies
create policy local_classes_public_read on local_classes for select using (true);
create policy local_classes_admin_all on local_classes for all using (true) with check (true);
create policy local_class_hierarchy_public_read on local_class_hierarchy for select using (true);
create policy local_class_links_public_read on local_class_links for select using (true);

create policy chakai_items_read on chakai_items for select using (
    exists (
        select 1
        from chakai c
        where c.id = chakai_id
            and (
                c.visibility = 'open'
                or (
                    c.visibility = 'members'
                    and exists (
                        select 1
                        from chakai_attendees ca
                            join accounts a on a.id = ca.account_id
                        where ca.chakai_id = c.id
                            and a.email = current_setting('request.jwt.claims', true)::json->>'email'
                    )
                )
            )
    )
);

create policy chakai_items_admin_read on chakai_items for select using (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
);

create policy chakai_items_admin_write on chakai_items for all using (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
);

create policy chakai_media_links_read on chakai_media_links for select using (
    exists (
        select 1
        from chakai c
        where c.id = chakai_id
            and (
                c.visibility = 'open'
                or (
                    c.visibility = 'members'
                    and exists (
                        select 1
                        from chakai_attendees ca
                            join accounts a on a.id = ca.account_id
                        where ca.chakai_id = c.id
                            and a.email = current_setting('request.jwt.claims', true)::json->>'email'
                    )
                )
            )
    )
);

create policy media_public_read_chakai on media for select using (
    exists (
        select 1
        from chakai_media_links cml
            join chakai c on c.id = cml.chakai_id
        where cml.media_id = media.id
            and c.visibility = 'open'
            and media.visibility = 'public'
    )
    or exists (
        select 1
        from chakai_media_links cml
            join chakai c on c.id = cml.chakai_id
            join chakai_attendees ca on ca.chakai_id = c.id
            join accounts a on a.id = ca.account_id
        where cml.media_id = media.id
            and c.visibility = 'members'
            and a.email = current_setting('request.jwt.claims', true)::json->>'email'
            and (
                media.visibility = 'public'
                or media.visibility = 'private'
            )
    )
);

-- Comments for documentation
comment on table media is 'Media files with RLS enabled for security compliance';
comment on function swap_local_class_sort_order(integer, integer) is 'Swaps sort order between two local class items - secured against search_path attacks';
comment on function lc_after_insert() is 'Trigger function for local_classes after insert - secured against search_path attacks';
comment on function lc_before_update_parent() is 'Trigger function for local_classes before parent update - secured against search_path attacks';
comment on function set_local_class_local_number(integer, text) is 'Updates local number for local class - secured against search_path attacks';
comment on policy local_classes_admin_all on local_classes is 'Allows all operations on local_classes. Authorization is handled by requireAdmin() in application layer using supabaseAdmin client.';