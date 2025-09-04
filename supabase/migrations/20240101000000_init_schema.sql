-- Initial schema migration based on current production database
-- Generated from live Supabase database on 2025-09-04

-- Core tables

-- Accounts table for user management
CREATE TABLE IF NOT EXISTS accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name_en text,
  full_name_ja text,
  role text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  tea_school_id uuid,
  tea_school text,
  tea_school_ja text,
  website text,
  bio text,
  bio_ja text
);

-- Tea schools reference table
CREATE TABLE IF NOT EXISTS tea_schools (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_ja text
);

-- Locations (tea rooms) table
CREATE TABLE IF NOT EXISTS locations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  local_number text NOT NULL,
  name text NOT NULL,
  address text,
  url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  visibility text DEFAULT 'public'::text,
  name_en text,
  name_ja text,
  address_en text,
  address_ja text,
  lat double precision,
  lng double precision,
  google_place_id text,
  google_maps_url text,
  contained_in text,
  contained_in_en text,
  contained_in_ja text,
  token text
);

-- Classifications for taxonomic organization
CREATE TABLE IF NOT EXISTS classifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  label text NOT NULL,
  label_ja text,
  kind text NOT NULL,
  scheme text NOT NULL,
  uri text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Local classes (project-specific taxonomy)
CREATE TABLE IF NOT EXISTS local_classes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  token text,
  local_number text,
  label_en text,
  label_ja text,
  description text,
  parent_id uuid,
  preferred_classification_id uuid,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  sort_order integer
);

-- Local class hierarchy (closure table)
CREATE TABLE IF NOT EXISTS local_class_hierarchy (
  ancestor_id uuid NOT NULL,
  descendant_id uuid NOT NULL,
  depth integer NOT NULL
);

-- Links between local classes and external classifications
CREATE TABLE IF NOT EXISTS local_class_links (
  local_class_id uuid NOT NULL,
  classification_id uuid NOT NULL,
  is_preferred boolean DEFAULT false,
  confidence smallint,
  note text
);

-- Objects (tea utensils/items)
CREATE TABLE IF NOT EXISTS objects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  token text NOT NULL,
  ark_name text,
  naan text,
  local_number text,
  title text NOT NULL,
  title_ja text,
  visibility text NOT NULL DEFAULT 'public'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  price numeric(12,2),
  tags text[],
  craftsman text,
  event_date date,
  location text,
  notes text,
  store text,
  url text,
  craftsman_ja text,
  location_ja text,
  notes_ja text,
  store_ja text,
  primary_local_class_id uuid
);

-- Object classifications (many-to-many)
CREATE TABLE IF NOT EXISTS object_classifications (
  object_id uuid NOT NULL,
  classification_id uuid NOT NULL,
  role text NOT NULL
);

-- Chakai (tea gathering events)
CREATE TABLE IF NOT EXISTS chakai (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  local_number text NOT NULL,
  event_date date NOT NULL,
  start_time time without time zone,
  location_id uuid,
  visibility text NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  name_en text,
  name_ja text,
  token text
);

-- Chakai attendees (many-to-many between chakai and accounts)
CREATE TABLE IF NOT EXISTS chakai_attendees (
  chakai_id uuid NOT NULL,
  account_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Chakai items (many-to-many between chakai and objects)
CREATE TABLE IF NOT EXISTS chakai_items (
  chakai_id uuid NOT NULL,
  object_id uuid NOT NULL,
  role text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Licenses for media
CREATE TABLE IF NOT EXISTS licenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  uri text NOT NULL,
  summary text
);

-- Media files and attachments
CREATE TABLE IF NOT EXISTS media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  object_id uuid,
  kind text NOT NULL,
  uri text NOT NULL,
  source text,
  width integer,
  height integer,
  license text,
  sort_order integer NOT NULL DEFAULT 0,
  copyright_owner text,
  rights_note text,
  license_id uuid,
  bucket text DEFAULT 'media'::text,
  storage_path text,
  visibility text DEFAULT 'public'::text,
  local_number text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  token text,
  file_type text DEFAULT 'image'::text,
  file_size integer,
  original_filename text
);

-- Object media links (many-to-many)
CREATE TABLE IF NOT EXISTS object_media_links (
  object_id uuid NOT NULL,
  media_id uuid NOT NULL,
  role text DEFAULT 'related'::text
);

-- Location media links (many-to-many)
CREATE TABLE IF NOT EXISTS location_media_links (
  location_id uuid NOT NULL,
  media_id uuid NOT NULL,
  role text DEFAULT 'related'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Chakai media links (many-to-many for PDF attachments, etc.)
CREATE TABLE IF NOT EXISTS chakai_media_links (
  chakai_id uuid NOT NULL,
  media_id uuid NOT NULL,
  role text DEFAULT 'attachment'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Valuations for objects
CREATE TABLE IF NOT EXISTS valuations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  object_id uuid NOT NULL,
  as_of_date date NOT NULL,
  currency text NOT NULL,
  amount numeric(18,2) NOT NULL,
  source text,
  source_url text,
  visibility text NOT NULL DEFAULT 'private'::text
);

-- Local counters for generating local numbers
CREATE TABLE IF NOT EXISTS local_counters (
  kind text NOT NULL,
  year integer NOT NULL,
  value integer NOT NULL
);

-- URL redirects
CREATE TABLE IF NOT EXISTS redirects (
  old_path text NOT NULL,
  new_path text NOT NULL
);

-- Add primary key constraints
ALTER TABLE accounts ADD CONSTRAINT IF NOT EXISTS accounts_pkey PRIMARY KEY (id);
ALTER TABLE chakai ADD CONSTRAINT IF NOT EXISTS chakai_pkey PRIMARY KEY (id);
ALTER TABLE chakai_attendees ADD CONSTRAINT IF NOT EXISTS chakai_attendees_pkey PRIMARY KEY (chakai_id, account_id);
ALTER TABLE chakai_items ADD CONSTRAINT IF NOT EXISTS chakai_items_pkey PRIMARY KEY (chakai_id, object_id);
ALTER TABLE chakai_media_links ADD CONSTRAINT IF NOT EXISTS chakai_media_links_pkey PRIMARY KEY (chakai_id, media_id);
ALTER TABLE classifications ADD CONSTRAINT IF NOT EXISTS classifications_pkey PRIMARY KEY (id);
ALTER TABLE licenses ADD CONSTRAINT IF NOT EXISTS licenses_pkey PRIMARY KEY (id);
ALTER TABLE local_class_hierarchy ADD CONSTRAINT IF NOT EXISTS local_class_hierarchy_pkey PRIMARY KEY (ancestor_id, descendant_id);
ALTER TABLE local_class_links ADD CONSTRAINT IF NOT EXISTS local_class_links_pkey PRIMARY KEY (local_class_id, classification_id);
ALTER TABLE local_classes ADD CONSTRAINT IF NOT EXISTS local_classes_pkey PRIMARY KEY (id);
ALTER TABLE local_counters ADD CONSTRAINT IF NOT EXISTS local_counters_pkey PRIMARY KEY (kind, year);
ALTER TABLE location_media_links ADD CONSTRAINT IF NOT EXISTS location_media_links_pkey PRIMARY KEY (location_id, media_id);
ALTER TABLE locations ADD CONSTRAINT IF NOT EXISTS locations_pkey PRIMARY KEY (id);
ALTER TABLE media ADD CONSTRAINT IF NOT EXISTS media_pkey PRIMARY KEY (id);
ALTER TABLE object_classifications ADD CONSTRAINT IF NOT EXISTS object_classifications_pkey PRIMARY KEY (object_id, classification_id, role);
ALTER TABLE object_media_links ADD CONSTRAINT IF NOT EXISTS object_media_links_pkey PRIMARY KEY (object_id, media_id);
ALTER TABLE objects ADD CONSTRAINT IF NOT EXISTS objects_pkey PRIMARY KEY (id);
ALTER TABLE redirects ADD CONSTRAINT IF NOT EXISTS redirects_pkey PRIMARY KEY (old_path);
ALTER TABLE tea_schools ADD CONSTRAINT IF NOT EXISTS tea_schools_pkey PRIMARY KEY (id);
ALTER TABLE valuations ADD CONSTRAINT IF NOT EXISTS valuations_pkey PRIMARY KEY (id);

-- Add foreign key constraints
ALTER TABLE accounts ADD CONSTRAINT IF NOT EXISTS accounts_tea_school_id_fkey FOREIGN KEY (tea_school_id) REFERENCES tea_schools (id) ON DELETE CASCADE;
ALTER TABLE chakai ADD CONSTRAINT IF NOT EXISTS chakai_location_id_fkey FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE;
ALTER TABLE chakai_attendees ADD CONSTRAINT IF NOT EXISTS chakai_attendees_chakai_id_fkey FOREIGN KEY (chakai_id) REFERENCES chakai (id) ON DELETE CASCADE;
ALTER TABLE chakai_attendees ADD CONSTRAINT IF NOT EXISTS chakai_attendees_account_id_fkey FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE;
ALTER TABLE chakai_items ADD CONSTRAINT IF NOT EXISTS chakai_items_chakai_id_fkey FOREIGN KEY (chakai_id) REFERENCES chakai (id) ON DELETE CASCADE;
ALTER TABLE chakai_items ADD CONSTRAINT IF NOT EXISTS chakai_items_object_id_fkey FOREIGN KEY (object_id) REFERENCES objects (id) ON DELETE CASCADE;
ALTER TABLE chakai_media_links ADD CONSTRAINT IF NOT EXISTS chakai_media_links_chakai_id_fkey FOREIGN KEY (chakai_id) REFERENCES chakai (id) ON DELETE CASCADE;
ALTER TABLE chakai_media_links ADD CONSTRAINT IF NOT EXISTS chakai_media_links_media_id_fkey FOREIGN KEY (media_id) REFERENCES media (id) ON DELETE CASCADE;
ALTER TABLE local_classes ADD CONSTRAINT IF NOT EXISTS local_classes_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES local_classes (id) ON DELETE CASCADE;
ALTER TABLE local_classes ADD CONSTRAINT IF NOT EXISTS local_classes_preferred_classification_id_fkey FOREIGN KEY (preferred_classification_id) REFERENCES classifications (id) ON DELETE CASCADE;
ALTER TABLE local_class_hierarchy ADD CONSTRAINT IF NOT EXISTS local_class_hierarchy_ancestor_id_fkey FOREIGN KEY (ancestor_id) REFERENCES local_classes (id) ON DELETE CASCADE;
ALTER TABLE local_class_hierarchy ADD CONSTRAINT IF NOT EXISTS local_class_hierarchy_descendant_id_fkey FOREIGN KEY (descendant_id) REFERENCES local_classes (id) ON DELETE CASCADE;
ALTER TABLE local_class_links ADD CONSTRAINT IF NOT EXISTS local_class_links_local_class_id_fkey FOREIGN KEY (local_class_id) REFERENCES local_classes (id) ON DELETE CASCADE;
ALTER TABLE local_class_links ADD CONSTRAINT IF NOT EXISTS local_class_links_classification_id_fkey FOREIGN KEY (classification_id) REFERENCES classifications (id) ON DELETE CASCADE;
ALTER TABLE location_media_links ADD CONSTRAINT IF NOT EXISTS location_media_links_location_id_fkey FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE;
ALTER TABLE location_media_links ADD CONSTRAINT IF NOT EXISTS location_media_links_media_id_fkey FOREIGN KEY (media_id) REFERENCES media (id) ON DELETE CASCADE;
ALTER TABLE media ADD CONSTRAINT IF NOT EXISTS media_license_id_fkey FOREIGN KEY (license_id) REFERENCES licenses (id) ON DELETE CASCADE;
ALTER TABLE media ADD CONSTRAINT IF NOT EXISTS media_object_id_fkey FOREIGN KEY (object_id) REFERENCES objects (id) ON DELETE CASCADE;
ALTER TABLE object_classifications ADD CONSTRAINT IF NOT EXISTS object_classifications_object_id_fkey FOREIGN KEY (object_id) REFERENCES objects (id) ON DELETE CASCADE;
ALTER TABLE object_classifications ADD CONSTRAINT IF NOT EXISTS object_classifications_classification_id_fkey FOREIGN KEY (classification_id) REFERENCES classifications (id) ON DELETE CASCADE;
ALTER TABLE object_media_links ADD CONSTRAINT IF NOT EXISTS object_media_links_object_id_fkey FOREIGN KEY (object_id) REFERENCES objects (id) ON DELETE CASCADE;
ALTER TABLE object_media_links ADD CONSTRAINT IF NOT EXISTS object_media_links_media_id_fkey FOREIGN KEY (media_id) REFERENCES media (id) ON DELETE CASCADE;
ALTER TABLE objects ADD CONSTRAINT IF NOT EXISTS objects_primary_local_class_id_fkey FOREIGN KEY (primary_local_class_id) REFERENCES local_classes (id) ON DELETE CASCADE;
ALTER TABLE valuations ADD CONSTRAINT IF NOT EXISTS valuations_object_id_fkey FOREIGN KEY (object_id) REFERENCES objects (id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS accounts_email_key ON accounts (email);
CREATE UNIQUE INDEX IF NOT EXISTS chakai_local_number_key ON chakai (local_number);
CREATE UNIQUE INDEX IF NOT EXISTS chakai_token_unique ON chakai (token);
CREATE INDEX IF NOT EXISTS idx_chakai_event_date ON chakai (event_date);
CREATE INDEX IF NOT EXISTS idx_chakai_visibility ON chakai (visibility);
CREATE INDEX IF NOT EXISTS chakai_items_chakai_idx ON chakai_items (chakai_id);
CREATE INDEX IF NOT EXISTS chakai_items_object_idx ON chakai_items (object_id);
CREATE INDEX IF NOT EXISTS cml_chakai_idx ON chakai_media_links (chakai_id);
CREATE INDEX IF NOT EXISTS cml_media_idx ON chakai_media_links (media_id);
CREATE UNIQUE INDEX IF NOT EXISTS classifications_scheme_uri_uk ON classifications (scheme, uri);
CREATE UNIQUE INDEX IF NOT EXISTS licenses_code_key ON licenses (code);
CREATE INDEX IF NOT EXISTS lch_ancestor_idx ON local_class_hierarchy (ancestor_id);
CREATE INDEX IF NOT EXISTS lch_descendant_idx ON local_class_hierarchy (descendant_id);
CREATE INDEX IF NOT EXISTS lcl_class_idx ON local_class_links (classification_id);
CREATE INDEX IF NOT EXISTS lcl_local_idx ON local_class_links (local_class_id);
CREATE UNIQUE INDEX IF NOT EXISTS local_classes_local_number_key ON local_classes (local_number);
CREATE INDEX IF NOT EXISTS local_classes_parent_idx ON local_classes (parent_id);
CREATE INDEX IF NOT EXISTS local_classes_sort_order_idx ON local_classes (sort_order, local_number);
CREATE UNIQUE INDEX IF NOT EXISTS local_classes_token_key ON local_classes (token);
CREATE INDEX IF NOT EXISTS lml_media_idx ON location_media_links (media_id);
CREATE UNIQUE INDEX IF NOT EXISTS locations_local_number_key ON locations (local_number);
CREATE UNIQUE INDEX IF NOT EXISTS locations_token_unique ON locations (token);
CREATE INDEX IF NOT EXISTS idx_media_object ON media (object_id);
CREATE UNIQUE INDEX IF NOT EXISTS media_local_number_key ON media (local_number);
CREATE UNIQUE INDEX IF NOT EXISTS media_token_unique ON media (token);
CREATE INDEX IF NOT EXISTS oc_class_idx ON object_classifications (classification_id);
CREATE INDEX IF NOT EXISTS oc_object_idx ON object_classifications (object_id);
CREATE INDEX IF NOT EXISTS oml_media_idx ON object_media_links (media_id);
CREATE INDEX IF NOT EXISTS idx_objects_token ON objects (token);
CREATE INDEX IF NOT EXISTS idx_objects_visibility ON objects (visibility);
CREATE UNIQUE INDEX IF NOT EXISTS objects_ark_name_key ON objects (ark_name);
CREATE UNIQUE INDEX IF NOT EXISTS objects_token_key ON objects (token);
CREATE INDEX IF NOT EXISTS idx_val_object ON valuations (object_id);