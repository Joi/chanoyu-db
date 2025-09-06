

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."get_and_increment_counter"("p_kind" "text", "p_year" integer) RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
declare
  v_value int;
begin
  loop
    update local_counters
       set value = value + 1
     where kind = p_kind and year = p_year
     returning value into v_value;
    if found then
      return v_value;
    end if;

    begin
      insert into local_counters(kind, year, value)
      values (p_kind, p_year, 1)
      on conflict (kind, year) do nothing;
    exception when unique_violation then
      -- ignore; another transaction inserted concurrently
      null;
    end;
    -- retry the loop
  end loop;
end $$;


ALTER FUNCTION "public"."get_and_increment_counter"("p_kind" "text", "p_year" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."lc_after_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- self link
  insert into local_class_hierarchy (ancestor_id, descendant_id, depth)
  values (new.id, new.id, 0)
  on conflict do nothing;

  if new.parent_id is not null then
    -- link all ancestors of parent (including parent) to the new node
    insert into local_class_hierarchy (ancestor_id, descendant_id, depth)
    select a.ancestor_id, new.id, a.depth + 1
    from local_class_hierarchy a
    where a.descendant_id = new.parent_id
    on conflict do nothing;
  end if;
  return null;
end;
$$;


ALTER FUNCTION "public"."lc_after_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."lc_before_update_parent"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  has_cycle boolean;
begin
  if new.parent_id is distinct from old.parent_id then
    if new.parent_id is not null then
      if new.parent_id = new.id then
        raise exception 'local_classes: parent_id cannot equal id';
      end if;
      -- cycle check: new parent cannot be a descendant of the node
      select exists (
        select 1 from local_class_hierarchy
        where ancestor_id = new.id and descendant_id = new.parent_id
      ) into has_cycle;
      if has_cycle then
        raise exception 'local_classes: parent_id cannot create a cycle';
      end if;
    end if;

    -- Rewire closure for the subtree rooted at NEW.id
    -- 1) Delete links from former ancestors to the subtree
    delete from local_class_hierarchy h
    using (
      select descendant_id from local_class_hierarchy where ancestor_id = new.id
    ) d
    where h.descendant_id = d.descendant_id
      and h.ancestor_id not in (
        select descendant_id from local_class_hierarchy where ancestor_id = new.id
      );

    -- 2) Insert links from new ancestors to the subtree
    if new.parent_id is not null then
      insert into local_class_hierarchy (ancestor_id, descendant_id, depth)
      select a.ancestor_id, d.descendant_id, a.depth + 1 + d.depth
      from local_class_hierarchy a
      cross join local_class_hierarchy d
      where a.descendant_id = new.parent_id
        and d.ancestor_id = new.id
      on conflict do nothing;
    end if;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."lc_before_update_parent"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."oc_block_primary_type_writes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if (tg_op = 'INSERT' or tg_op = 'UPDATE') and new.role = 'primary type' then
    raise exception 'Writes to object_classifications with role=primary type are disabled; use Local Classes';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."oc_block_primary_type_writes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_chakai_local_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_date date := new.event_date;
  v_hour text := coalesce(to_char(new.start_time, 'HH24'), '00');
begin
  if new.local_number is not null then
    return new;
  end if;
  if v_date is null then
    raise exception 'chakai.event_date must be set before insert to generate local_number';
  end if;
  new.local_number :=
    'ITO-K-' || to_char(v_date, 'YYYY') || '-' || to_char(v_date, 'MMDD') || v_hour;
  return new;
end $$;


ALTER FUNCTION "public"."set_chakai_local_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_local_class_local_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.local_number is null then
    new.local_number := 'ITO-C-' || lpad(nextval('local_class_local_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."set_local_class_local_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_location_local_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_year int := extract(year from coalesce(new.created_at, now()));
  v_seq int;
begin
  if new.local_number is not null then
    return new;
  end if;
  v_seq := get_and_increment_counter('L', v_year);
  new.local_number := 'ITO-L-' || v_year::text || '-' || lpad(v_seq::text, 5, '0');
  return new;
end $$;


ALTER FUNCTION "public"."set_location_local_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_media_local_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.local_number is null then
    new.local_number := 'ITO-M-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('media_local_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."set_media_local_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end $$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."swap_local_class_sort_order"("class_id_1" "uuid", "class_id_2" "uuid") RETURNS TABLE("success" boolean, "error_message" "text", "class1_old_sort" integer, "class1_new_sort" integer, "class2_old_sort" integer, "class2_new_sort" integer)
    LANGUAGE "plpgsql"
    AS $$
  DECLARE
    sort1 INTEGER;
    sort2 INTEGER;
    affected_rows INTEGER;
  BEGIN
    -- Start transaction (function is atomic by default)

    -- Get current sort_order values for both classes
    SELECT sort_order INTO sort1
    FROM local_classes
    WHERE id = class_id_1 AND parent_id IS NULL;

    SELECT sort_order INTO sort2
    FROM local_classes
    WHERE id = class_id_2 AND parent_id IS NULL;

    -- Validate both classes exist and are top-level
    IF sort1 IS NULL OR sort2 IS NULL THEN
      RETURN QUERY SELECT
        FALSE,
        'One or both classes not found or not top-level',
        sort1,
        sort2,
        sort2,
        sort1;
      RETURN;
    END IF;

    -- Perform the atomic swap using a temporary negative value to avoid conflicts
    -- Step 1: Set first class to negative temp value
    UPDATE local_classes
    SET sort_order = -999999
    WHERE id = class_id_1;

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    IF affected_rows != 1 THEN
      RETURN QUERY SELECT
        FALSE,
        'Failed to update first class',
        sort1,
        sort2,
        sort2,
        sort1;
      RETURN;
    END IF;

    -- Step 2: Set second class to first class's original value
    UPDATE local_classes
    SET sort_order = sort1
    WHERE id = class_id_2;

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    IF affected_rows != 1 THEN
      RETURN QUERY SELECT
        FALSE,
        'Failed to update second class',
        sort1,
        sort2,
        sort2,
        sort1;
      RETURN;
    END IF;

    -- Step 3: Set first class to second class's original value
    UPDATE local_classes
    SET sort_order = sort2
    WHERE id = class_id_1;

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    IF affected_rows != 1 THEN
      RETURN QUERY SELECT
        FALSE,
        'Failed to complete swap for first class',
        sort1,
        sort2,
        sort2,
        sort1;
      RETURN;
    END IF;

    -- Return success with old and new values
    RETURN QUERY SELECT
      TRUE,
      'Swap completed successfully'::TEXT,
      sort1,
      sort2,  -- class1's new sort_order (was sort2)
      sort2,
      sort1;  -- class2's new sort_order (was sort1)

  EXCEPTION WHEN OTHERS THEN
    -- Return error information
    RETURN QUERY SELECT
      FALSE,
      SQLERRM::TEXT,
      sort1,
      sort2,
      sort2,
      sort1;
  END;
  $$;


ALTER FUNCTION "public"."swap_local_class_sort_order"("class_id_1" "uuid", "class_id_2" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."swap_local_class_sort_order"("class_id_1" "uuid", "class_id_2" "uuid") IS 'Atomically swaps sort_order between two top-level local_classes. Used for reordering functionality in
  admin interface.';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "full_name_en" "text",
    "full_name_ja" "text",
    "role" "text" NOT NULL,
    "password_hash" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tea_school_id" "uuid",
    "tea_school" "text",
    "tea_school_ja" "text",
    "website" "text",
    "bio" "text",
    "bio_ja" "text",
    CONSTRAINT "accounts_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'guest'::"text"])))
);


ALTER TABLE "public"."accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chakai" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "local_number" "text" NOT NULL,
    "event_date" "date" NOT NULL,
    "start_time" time without time zone,
    "location_id" "uuid",
    "visibility" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name_en" "text",
    "name_ja" "text",
    "token" "text",
    CONSTRAINT "chakai_visibility_check" CHECK (("visibility" = ANY (ARRAY['open'::"text", 'members'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."chakai" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chakai_attendees" (
    "chakai_id" "uuid" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chakai_attendees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chakai_items" (
    "chakai_id" "uuid" NOT NULL,
    "object_id" "uuid" NOT NULL,
    "role" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chakai_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chakai_media_links" (
    "chakai_id" "uuid" NOT NULL,
    "media_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'attachment'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chakai_media_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."classifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "label" "text" NOT NULL,
    "label_ja" "text",
    "kind" "text" NOT NULL,
    "scheme" "text" NOT NULL,
    "uri" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."classifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."licenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "uri" "text" NOT NULL,
    "summary" "text"
);


ALTER TABLE "public"."licenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."local_class_hierarchy" (
    "ancestor_id" "uuid" NOT NULL,
    "descendant_id" "uuid" NOT NULL,
    "depth" integer NOT NULL
);


ALTER TABLE "public"."local_class_hierarchy" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."local_class_links" (
    "local_class_id" "uuid" NOT NULL,
    "classification_id" "uuid" NOT NULL,
    "is_preferred" boolean DEFAULT false,
    "confidence" smallint,
    "note" "text"
);


ALTER TABLE "public"."local_class_links" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."local_class_local_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."local_class_local_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."objects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "token" "text" NOT NULL,
    "ark_name" "text",
    "naan" "text",
    "local_number" "text",
    "title" "text" NOT NULL,
    "title_ja" "text",
    "visibility" "text" DEFAULT 'public'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "price" numeric(12,2),
    "tags" "text"[],
    "craftsman" "text",
    "event_date" "date",
    "location" "text",
    "notes" "text",
    "store" "text",
    "url" "text",
    "craftsman_ja" "text",
    "location_ja" "text",
    "notes_ja" "text",
    "store_ja" "text",
    "primary_local_class_id" "uuid",
    CONSTRAINT "objects_visibility_check" CHECK (("visibility" = ANY (ARRAY['public'::"text", 'private'::"text", 'redacted'::"text"])))
);


ALTER TABLE "public"."objects" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."local_class_object_counts_direct" AS
 SELECT "primary_local_class_id" AS "local_class_id",
    "count"(*) AS "object_count"
   FROM "public"."objects"
  WHERE ("primary_local_class_id" IS NOT NULL)
  GROUP BY "primary_local_class_id";


ALTER VIEW "public"."local_class_object_counts_direct" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."local_class_object_counts_total" AS
 SELECT "h"."ancestor_id" AS "local_class_id",
    "count"("o"."id") AS "object_count"
   FROM ("public"."objects" "o"
     JOIN "public"."local_class_hierarchy" "h" ON (("h"."descendant_id" = "o"."primary_local_class_id")))
  GROUP BY "h"."ancestor_id";


ALTER VIEW "public"."local_class_object_counts_total" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."local_classes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "token" "text",
    "local_number" "text",
    "label_en" "text",
    "label_ja" "text",
    "description" "text",
    "parent_id" "uuid",
    "preferred_classification_id" "uuid",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sort_order" integer,
    CONSTRAINT "local_classes_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'draft'::"text", 'deprecated'::"text"])))
);


ALTER TABLE "public"."local_classes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."local_counters" (
    "kind" "text" NOT NULL,
    "year" integer NOT NULL,
    "value" integer NOT NULL
);


ALTER TABLE "public"."local_counters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."location_media_links" (
    "location_id" "uuid" NOT NULL,
    "media_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'related'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."location_media_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "local_number" "text" NOT NULL,
    "name" "text" NOT NULL,
    "address" "text",
    "url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "visibility" "text" DEFAULT 'public'::"text",
    "name_en" "text",
    "name_ja" "text",
    "address_en" "text",
    "address_ja" "text",
    "lat" double precision,
    "lng" double precision,
    "google_place_id" "text",
    "google_maps_url" "text",
    "contained_in" "text",
    "contained_in_en" "text",
    "contained_in_ja" "text",
    "token" "text",
    CONSTRAINT "locations_visibility_check" CHECK (("visibility" = ANY (ARRAY['public'::"text", 'private'::"text"])))
);


ALTER TABLE "public"."locations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."media_local_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."media_local_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."media" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "object_id" "uuid",
    "kind" "text" NOT NULL,
    "uri" "text" NOT NULL,
    "source" "text",
    "width" integer,
    "height" integer,
    "license" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "copyright_owner" "text",
    "rights_note" "text",
    "license_id" "uuid",
    "bucket" "text" DEFAULT 'media'::"text",
    "storage_path" "text",
    "visibility" "text" DEFAULT 'public'::"text",
    "local_number" "text" DEFAULT ((('ITO-M-'::"text" || "to_char"("now"(), 'YYYY'::"text")) || '-'::"text") || "lpad"(("nextval"('"public"."media_local_seq"'::"regclass"))::"text", 5, '0'::"text")),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "token" "text",
    "file_type" "text" DEFAULT 'image'::"text",
    "file_size" integer,
    "original_filename" "text",
    CONSTRAINT "media_kind_check" CHECK (("kind" = ANY (ARRAY['image'::"text", 'iiif-manifest'::"text", 'document'::"text"]))),
    CONSTRAINT "media_visibility_check" CHECK (("visibility" = ANY (ARRAY['public'::"text", 'private'::"text"])))
);


ALTER TABLE "public"."media" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."object_classifications" (
    "object_id" "uuid" NOT NULL,
    "classification_id" "uuid" NOT NULL,
    "role" "text" NOT NULL
);


ALTER TABLE "public"."object_classifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."object_media_links" (
    "object_id" "uuid" NOT NULL,
    "media_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'related'::"text"
);


ALTER TABLE "public"."object_media_links" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."object_preferred_classification" AS
 SELECT "o"."id" AS "object_id",
    "o"."token",
    "lc"."id" AS "local_class_id",
    "lc"."label_en" AS "local_class_label_en",
    "lc"."label_ja" AS "local_class_label_ja",
    "c"."id" AS "classification_id",
    "c"."scheme" AS "classification_scheme",
    "c"."uri" AS "classification_uri",
    "c"."label" AS "classification_label",
    "c"."label_ja" AS "classification_label_ja"
   FROM (("public"."objects" "o"
     JOIN "public"."local_classes" "lc" ON (("lc"."id" = "o"."primary_local_class_id")))
     LEFT JOIN "public"."classifications" "c" ON (("c"."id" = "lc"."preferred_classification_id")));


ALTER VIEW "public"."object_preferred_classification" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."redirects" (
    "old_path" "text" NOT NULL,
    "new_path" "text" NOT NULL
);


ALTER TABLE "public"."redirects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tea_schools" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name_en" "text" NOT NULL,
    "name_ja" "text"
);


ALTER TABLE "public"."tea_schools" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."valuations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "object_id" "uuid" NOT NULL,
    "as_of_date" "date" NOT NULL,
    "currency" "text" NOT NULL,
    "amount" numeric(18,2) NOT NULL,
    "source" "text",
    "source_url" "text",
    "visibility" "text" DEFAULT 'private'::"text" NOT NULL,
    CONSTRAINT "valuations_visibility_check" CHECK (("visibility" = ANY (ARRAY['public'::"text", 'private'::"text"])))
);


ALTER TABLE "public"."valuations" OWNER TO "postgres";


ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chakai_attendees"
    ADD CONSTRAINT "chakai_attendees_pkey" PRIMARY KEY ("chakai_id", "account_id");



ALTER TABLE ONLY "public"."chakai_items"
    ADD CONSTRAINT "chakai_items_pkey" PRIMARY KEY ("chakai_id", "object_id");



ALTER TABLE ONLY "public"."chakai"
    ADD CONSTRAINT "chakai_local_number_key" UNIQUE ("local_number");



ALTER TABLE ONLY "public"."chakai_media_links"
    ADD CONSTRAINT "chakai_media_links_pkey" PRIMARY KEY ("chakai_id", "media_id");



ALTER TABLE ONLY "public"."chakai"
    ADD CONSTRAINT "chakai_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."classifications"
    ADD CONSTRAINT "classifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."classifications"
    ADD CONSTRAINT "classifications_scheme_uri_uk" UNIQUE ("scheme", "uri");



ALTER TABLE ONLY "public"."licenses"
    ADD CONSTRAINT "licenses_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."licenses"
    ADD CONSTRAINT "licenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."local_class_hierarchy"
    ADD CONSTRAINT "local_class_hierarchy_pkey" PRIMARY KEY ("ancestor_id", "descendant_id");



ALTER TABLE ONLY "public"."local_class_links"
    ADD CONSTRAINT "local_class_links_pkey" PRIMARY KEY ("local_class_id", "classification_id");



ALTER TABLE ONLY "public"."local_classes"
    ADD CONSTRAINT "local_classes_local_number_key" UNIQUE ("local_number");



ALTER TABLE ONLY "public"."local_classes"
    ADD CONSTRAINT "local_classes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."local_classes"
    ADD CONSTRAINT "local_classes_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."local_counters"
    ADD CONSTRAINT "local_counters_pkey" PRIMARY KEY ("kind", "year");



ALTER TABLE ONLY "public"."location_media_links"
    ADD CONSTRAINT "location_media_links_pkey" PRIMARY KEY ("location_id", "media_id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_local_number_key" UNIQUE ("local_number");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_local_number_key" UNIQUE ("local_number");



ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."object_classifications"
    ADD CONSTRAINT "object_classifications_pkey" PRIMARY KEY ("object_id", "classification_id", "role");



ALTER TABLE ONLY "public"."object_media_links"
    ADD CONSTRAINT "object_media_links_pkey" PRIMARY KEY ("object_id", "media_id");



ALTER TABLE ONLY "public"."objects"
    ADD CONSTRAINT "objects_ark_name_key" UNIQUE ("ark_name");



ALTER TABLE ONLY "public"."objects"
    ADD CONSTRAINT "objects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."objects"
    ADD CONSTRAINT "objects_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."redirects"
    ADD CONSTRAINT "redirects_pkey" PRIMARY KEY ("old_path");



ALTER TABLE ONLY "public"."tea_schools"
    ADD CONSTRAINT "tea_schools_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."valuations"
    ADD CONSTRAINT "valuations_pkey" PRIMARY KEY ("id");



CREATE INDEX "chakai_items_chakai_idx" ON "public"."chakai_items" USING "btree" ("chakai_id");



CREATE INDEX "chakai_items_object_idx" ON "public"."chakai_items" USING "btree" ("object_id");



CREATE UNIQUE INDEX "chakai_local_number_ci" ON "public"."chakai" USING "btree" ("lower"("local_number")) WHERE ("local_number" IS NOT NULL);



CREATE UNIQUE INDEX "chakai_token_unique" ON "public"."chakai" USING "btree" ("token") WHERE ("token" IS NOT NULL);



CREATE INDEX "cml_chakai_idx" ON "public"."chakai_media_links" USING "btree" ("chakai_id");



CREATE INDEX "cml_media_idx" ON "public"."chakai_media_links" USING "btree" ("media_id");



CREATE INDEX "idx_chakai_event_date" ON "public"."chakai" USING "btree" ("event_date");



CREATE INDEX "idx_chakai_visibility" ON "public"."chakai" USING "btree" ("visibility");



CREATE INDEX "idx_locations_name" ON "public"."locations" USING "gin" ("to_tsvector"('"simple"'::"regconfig", COALESCE("name", ''::"text")));



CREATE INDEX "idx_media_object" ON "public"."media" USING "btree" ("object_id");



CREATE INDEX "idx_objects_token" ON "public"."objects" USING "btree" ("token");



CREATE INDEX "idx_objects_visibility" ON "public"."objects" USING "btree" ("visibility");



CREATE INDEX "idx_val_object" ON "public"."valuations" USING "btree" ("object_id");



CREATE INDEX "lch_ancestor_idx" ON "public"."local_class_hierarchy" USING "btree" ("ancestor_id");



CREATE INDEX "lch_descendant_idx" ON "public"."local_class_hierarchy" USING "btree" ("descendant_id");



CREATE INDEX "lcl_class_idx" ON "public"."local_class_links" USING "btree" ("classification_id");



CREATE INDEX "lcl_local_idx" ON "public"."local_class_links" USING "btree" ("local_class_id");



CREATE INDEX "lml_media_idx" ON "public"."location_media_links" USING "btree" ("media_id");



CREATE UNIQUE INDEX "local_classes_local_number_ci" ON "public"."local_classes" USING "btree" ("lower"("local_number")) WHERE ("local_number" IS NOT NULL);



CREATE INDEX "local_classes_parent_idx" ON "public"."local_classes" USING "btree" ("parent_id");



CREATE INDEX "local_classes_sort_order_idx" ON "public"."local_classes" USING "btree" ("sort_order", "local_number");



CREATE UNIQUE INDEX "locations_local_number_ci" ON "public"."locations" USING "btree" ("lower"("local_number")) WHERE ("local_number" IS NOT NULL);



CREATE UNIQUE INDEX "locations_token_unique" ON "public"."locations" USING "btree" ("token") WHERE ("token" IS NOT NULL);



CREATE UNIQUE INDEX "media_local_number_ci" ON "public"."media" USING "btree" ("lower"("local_number")) WHERE ("local_number" IS NOT NULL);



CREATE UNIQUE INDEX "media_local_number_uniq" ON "public"."media" USING "btree" ("lower"("local_number"));



CREATE UNIQUE INDEX "media_token_unique" ON "public"."media" USING "btree" ("token") WHERE ("token" IS NOT NULL);



CREATE UNIQUE INDEX "objects_local_number_ci" ON "public"."objects" USING "btree" ("lower"("local_number")) WHERE ("local_number" IS NOT NULL);



CREATE UNIQUE INDEX "objects_local_number_uniq" ON "public"."objects" USING "btree" ("lower"("local_number"));



CREATE INDEX "oc_class_idx" ON "public"."object_classifications" USING "btree" ("classification_id");



CREATE INDEX "oc_object_idx" ON "public"."object_classifications" USING "btree" ("object_id");



CREATE INDEX "oml_media_idx" ON "public"."object_media_links" USING "btree" ("media_id");



CREATE UNIQUE INDEX "u_classifications" ON "public"."classifications" USING "btree" ("scheme", "uri");



CREATE OR REPLACE TRIGGER "set_updated_at_on_chakai" BEFORE UPDATE ON "public"."chakai" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_on_locations" BEFORE UPDATE ON "public"."locations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_chakai_local_number" BEFORE INSERT ON "public"."chakai" FOR EACH ROW EXECUTE FUNCTION "public"."set_chakai_local_number"();



CREATE OR REPLACE TRIGGER "trg_lc_after_insert" AFTER INSERT ON "public"."local_classes" FOR EACH ROW EXECUTE FUNCTION "public"."lc_after_insert"();



CREATE OR REPLACE TRIGGER "trg_lc_before_update_parent" BEFORE UPDATE OF "parent_id" ON "public"."local_classes" FOR EACH ROW EXECUTE FUNCTION "public"."lc_before_update_parent"();



CREATE OR REPLACE TRIGGER "trg_local_class_local_number" BEFORE INSERT ON "public"."local_classes" FOR EACH ROW EXECUTE FUNCTION "public"."set_local_class_local_number"();



CREATE OR REPLACE TRIGGER "trg_locations_local_number" BEFORE INSERT ON "public"."locations" FOR EACH ROW EXECUTE FUNCTION "public"."set_location_local_number"();



CREATE OR REPLACE TRIGGER "trg_media_local_number" BEFORE INSERT ON "public"."media" FOR EACH ROW EXECUTE FUNCTION "public"."set_media_local_number"();



CREATE OR REPLACE TRIGGER "trg_oc_block_primary_type" BEFORE INSERT OR UPDATE ON "public"."object_classifications" FOR EACH ROW EXECUTE FUNCTION "public"."oc_block_primary_type_writes"();



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_tea_school_id_fkey" FOREIGN KEY ("tea_school_id") REFERENCES "public"."tea_schools"("id");



ALTER TABLE ONLY "public"."chakai_attendees"
    ADD CONSTRAINT "chakai_attendees_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chakai_attendees"
    ADD CONSTRAINT "chakai_attendees_chakai_id_fkey" FOREIGN KEY ("chakai_id") REFERENCES "public"."chakai"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chakai_items"
    ADD CONSTRAINT "chakai_items_chakai_id_fkey" FOREIGN KEY ("chakai_id") REFERENCES "public"."chakai"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chakai_items"
    ADD CONSTRAINT "chakai_items_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "public"."objects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chakai"
    ADD CONSTRAINT "chakai_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chakai_media_links"
    ADD CONSTRAINT "chakai_media_links_chakai_id_fkey" FOREIGN KEY ("chakai_id") REFERENCES "public"."chakai"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chakai_media_links"
    ADD CONSTRAINT "chakai_media_links_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."local_class_hierarchy"
    ADD CONSTRAINT "local_class_hierarchy_ancestor_id_fkey" FOREIGN KEY ("ancestor_id") REFERENCES "public"."local_classes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."local_class_hierarchy"
    ADD CONSTRAINT "local_class_hierarchy_descendant_id_fkey" FOREIGN KEY ("descendant_id") REFERENCES "public"."local_classes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."local_class_links"
    ADD CONSTRAINT "local_class_links_classification_id_fkey" FOREIGN KEY ("classification_id") REFERENCES "public"."classifications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."local_class_links"
    ADD CONSTRAINT "local_class_links_local_class_id_fkey" FOREIGN KEY ("local_class_id") REFERENCES "public"."local_classes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."local_classes"
    ADD CONSTRAINT "local_classes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."local_classes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."local_classes"
    ADD CONSTRAINT "local_classes_preferred_classification_id_fkey" FOREIGN KEY ("preferred_classification_id") REFERENCES "public"."classifications"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."location_media_links"
    ADD CONSTRAINT "location_media_links_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."location_media_links"
    ADD CONSTRAINT "location_media_links_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "public"."licenses"("id");



ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "public"."objects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."object_classifications"
    ADD CONSTRAINT "object_classifications_classification_id_fkey" FOREIGN KEY ("classification_id") REFERENCES "public"."classifications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."object_classifications"
    ADD CONSTRAINT "object_classifications_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "public"."objects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."object_media_links"
    ADD CONSTRAINT "object_media_links_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."object_media_links"
    ADD CONSTRAINT "object_media_links_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "public"."objects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."objects"
    ADD CONSTRAINT "objects_primary_local_class_id_fkey" FOREIGN KEY ("primary_local_class_id") REFERENCES "public"."local_classes"("id");



ALTER TABLE ONLY "public"."valuations"
    ADD CONSTRAINT "valuations_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "public"."objects"("id") ON DELETE CASCADE;



ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "accounts_read_owner_only" ON "public"."accounts" FOR SELECT USING (false);



CREATE POLICY "accounts_write_owner_only" ON "public"."accounts" USING (false) WITH CHECK (false);



ALTER TABLE "public"."chakai" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chakai_attendees" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "chakai_attendees_parent_guard" ON "public"."chakai_attendees" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."chakai" "c"
  WHERE (("c"."id" = "chakai_attendees"."chakai_id") AND (("c"."visibility" = 'open'::"text") OR (("c"."visibility" = 'members'::"text") AND (("current_setting"('request.jwt.claim.role'::"text", true) = ANY (ARRAY['admin'::"text", 'owner'::"text"])) OR (EXISTS ( SELECT 1
           FROM "public"."accounts" "a"
          WHERE (("a"."id" = "chakai_attendees"."account_id") AND ("a"."email" = "current_setting"('request.jwt.claim.sub'::"text", true))))))) OR (("c"."visibility" = 'closed'::"text") AND ("current_setting"('request.jwt.claim.role'::"text", true) = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))))));



CREATE POLICY "chakai_closed_read" ON "public"."chakai" FOR SELECT USING ((("visibility" = 'closed'::"text") AND ("current_setting"('request.jwt.claim.role'::"text", true) = ANY (ARRAY['admin'::"text", 'owner'::"text"]))));



ALTER TABLE "public"."chakai_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "chakai_items_admin_read" ON "public"."chakai_items" FOR SELECT USING (((("current_setting"('request.jwt.claims'::"text", true))::json ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "chakai_items_admin_write" ON "public"."chakai_items" USING (((("current_setting"('request.jwt.claims'::"text", true))::json ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "chakai_items_parent_guard" ON "public"."chakai_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."chakai" "c"
  WHERE (("c"."id" = "chakai_items"."chakai_id") AND (("c"."visibility" = 'open'::"text") OR (("c"."visibility" = 'members'::"text") AND (("current_setting"('request.jwt.claim.role'::"text", true) = ANY (ARRAY['admin'::"text", 'owner'::"text"])) OR (EXISTS ( SELECT 1
           FROM ("public"."chakai_attendees" "ca"
             JOIN "public"."accounts" "a" ON (("a"."id" = "ca"."account_id")))
          WHERE (("ca"."chakai_id" = "c"."id") AND ("a"."email" = "current_setting"('request.jwt.claim.sub'::"text", true))))))) OR (("c"."visibility" = 'closed'::"text") AND ("current_setting"('request.jwt.claim.role'::"text", true) = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))))));



CREATE POLICY "chakai_items_read" ON "public"."chakai_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."chakai" "c"
  WHERE (("c"."id" = "chakai_items"."chakai_id") AND (("c"."visibility" = 'open'::"text") OR (("c"."visibility" = 'members'::"text") AND (EXISTS ( SELECT 1
           FROM ("public"."chakai_attendees" "ca"
             JOIN "public"."accounts" "a" ON (("a"."id" = "ca"."account_id")))
          WHERE (("ca"."chakai_id" = "c"."id") AND ("a"."email" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'email'::"text")))))))))));



ALTER TABLE "public"."chakai_media_links" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "chakai_media_links_read" ON "public"."chakai_media_links" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."chakai" "c"
  WHERE (("c"."id" = "chakai_media_links"."chakai_id") AND (("c"."visibility" = 'open'::"text") OR (("c"."visibility" = 'members'::"text") AND (EXISTS ( SELECT 1
           FROM ("public"."chakai_attendees" "ca"
             JOIN "public"."accounts" "a" ON (("a"."id" = "ca"."account_id")))
          WHERE (("ca"."chakai_id" = "c"."id") AND ("a"."email" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'email'::"text")))))))))));



CREATE POLICY "chakai_members_read" ON "public"."chakai" FOR SELECT USING ((("visibility" = 'members'::"text") AND (("current_setting"('request.jwt.claim.role'::"text", true) = ANY (ARRAY['admin'::"text", 'owner'::"text"])) OR (EXISTS ( SELECT 1
   FROM ("public"."chakai_attendees" "ca"
     JOIN "public"."accounts" "a" ON (("a"."id" = "ca"."account_id")))
  WHERE (("ca"."chakai_id" = "chakai"."id") AND ("a"."email" = "current_setting"('request.jwt.claim.sub'::"text", true))))))));



CREATE POLICY "chakai_open_read" ON "public"."chakai" FOR SELECT USING (("visibility" = 'open'::"text"));



ALTER TABLE "public"."classifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "classifications_public_read" ON "public"."classifications" FOR SELECT USING (true);



ALTER TABLE "public"."licenses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "licenses_public_read" ON "public"."licenses" FOR SELECT USING (true);



ALTER TABLE "public"."local_class_hierarchy" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "local_class_hierarchy_public_read" ON "public"."local_class_hierarchy" FOR SELECT USING (true);



ALTER TABLE "public"."local_class_links" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "local_class_links_public_read" ON "public"."local_class_links" FOR SELECT USING (true);



ALTER TABLE "public"."local_classes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "local_classes_admin_all" ON "public"."local_classes" USING (true) WITH CHECK (true);



COMMENT ON POLICY "local_classes_admin_all" ON "public"."local_classes" IS 'Allows all operations on local_classes. Authorization is handled by requireAdmin() in application layer
   using supabaseAdmin client.';



CREATE POLICY "local_classes_public_read" ON "public"."local_classes" FOR SELECT USING (true);



ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "locations_public_read" ON "public"."locations" FOR SELECT USING (true);



ALTER TABLE "public"."media" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "media_public_read" ON "public"."media" FOR SELECT USING (("visibility" = 'public'::"text"));



CREATE POLICY "media_public_read_chakai" ON "public"."media" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM ("public"."chakai_media_links" "cml"
     JOIN "public"."chakai" "c" ON (("c"."id" = "cml"."chakai_id")))
  WHERE (("cml"."media_id" = "media"."id") AND ("c"."visibility" = 'open'::"text") AND ("media"."visibility" = 'public'::"text")))) OR (EXISTS ( SELECT 1
   FROM ((("public"."chakai_media_links" "cml"
     JOIN "public"."chakai" "c" ON (("c"."id" = "cml"."chakai_id")))
     JOIN "public"."chakai_attendees" "ca" ON (("ca"."chakai_id" = "c"."id")))
     JOIN "public"."accounts" "a" ON (("a"."id" = "ca"."account_id")))
  WHERE (("cml"."media_id" = "media"."id") AND ("c"."visibility" = 'members'::"text") AND ("a"."email" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'email'::"text")) AND (("media"."visibility" = 'public'::"text") OR ("media"."visibility" = 'private'::"text")))))));



CREATE POLICY "media_public_read_locations" ON "public"."media" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."location_media_links" "lml"
     JOIN "public"."locations" "l" ON (("l"."id" = "lml"."location_id")))
  WHERE (("lml"."media_id" = "l"."id") AND ("l"."visibility" = 'public'::"text")))));



ALTER TABLE "public"."object_classifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."object_media_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."objects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "objects_public_read" ON "public"."objects" FOR SELECT USING (("visibility" = 'public'::"text"));



CREATE POLICY "oc_public_read" ON "public"."object_classifications" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."objects" "o"
  WHERE (("o"."id" = "object_classifications"."object_id") AND ("o"."visibility" = 'public'::"text")))));



CREATE POLICY "oml_public_read" ON "public"."object_media_links" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."objects" "o"
  WHERE (("o"."id" = "object_media_links"."object_id") AND ("o"."visibility" = 'public'::"text")))));



CREATE POLICY "public read classifications" ON "public"."classifications" FOR SELECT USING (true);



CREATE POLICY "public read media when object public" ON "public"."media" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."objects" "o"
  WHERE (("o"."id" = "media"."object_id") AND ("o"."visibility" = 'public'::"text")))));



CREATE POLICY "public read object_classifications when object public" ON "public"."object_classifications" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."objects" "o"
  WHERE (("o"."id" = "object_classifications"."object_id") AND ("o"."visibility" = 'public'::"text")))));



CREATE POLICY "public read public objects" ON "public"."objects" FOR SELECT USING (("visibility" = 'public'::"text"));



CREATE POLICY "public read valuations when public" ON "public"."valuations" FOR SELECT USING (("visibility" = 'public'::"text"));



CREATE POLICY "service_role all on classifications" ON "public"."classifications" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (true);



CREATE POLICY "service_role all on media" ON "public"."media" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (true);



CREATE POLICY "service_role all on object_classifications" ON "public"."object_classifications" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (true);



CREATE POLICY "service_role all on objects" ON "public"."objects" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (true);



CREATE POLICY "service_role all on valuations" ON "public"."valuations" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (true);



ALTER TABLE "public"."tea_schools" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tea_schools_public_read" ON "public"."tea_schools" FOR SELECT USING (true);



ALTER TABLE "public"."valuations" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_and_increment_counter"("p_kind" "text", "p_year" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_and_increment_counter"("p_kind" "text", "p_year" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_and_increment_counter"("p_kind" "text", "p_year" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."lc_after_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."lc_after_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."lc_after_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."lc_before_update_parent"() TO "anon";
GRANT ALL ON FUNCTION "public"."lc_before_update_parent"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."lc_before_update_parent"() TO "service_role";



GRANT ALL ON FUNCTION "public"."oc_block_primary_type_writes"() TO "anon";
GRANT ALL ON FUNCTION "public"."oc_block_primary_type_writes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."oc_block_primary_type_writes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_chakai_local_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_chakai_local_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_chakai_local_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_local_class_local_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_local_class_local_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_local_class_local_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_location_local_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_location_local_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_location_local_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_media_local_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_media_local_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_media_local_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."swap_local_class_sort_order"("class_id_1" "uuid", "class_id_2" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."swap_local_class_sort_order"("class_id_1" "uuid", "class_id_2" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."swap_local_class_sort_order"("class_id_1" "uuid", "class_id_2" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."accounts" TO "anon";
GRANT ALL ON TABLE "public"."accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts" TO "service_role";



GRANT ALL ON TABLE "public"."chakai" TO "anon";
GRANT ALL ON TABLE "public"."chakai" TO "authenticated";
GRANT ALL ON TABLE "public"."chakai" TO "service_role";



GRANT ALL ON TABLE "public"."chakai_attendees" TO "anon";
GRANT ALL ON TABLE "public"."chakai_attendees" TO "authenticated";
GRANT ALL ON TABLE "public"."chakai_attendees" TO "service_role";



GRANT ALL ON TABLE "public"."chakai_items" TO "anon";
GRANT ALL ON TABLE "public"."chakai_items" TO "authenticated";
GRANT ALL ON TABLE "public"."chakai_items" TO "service_role";



GRANT ALL ON TABLE "public"."chakai_media_links" TO "anon";
GRANT ALL ON TABLE "public"."chakai_media_links" TO "authenticated";
GRANT ALL ON TABLE "public"."chakai_media_links" TO "service_role";



GRANT ALL ON TABLE "public"."classifications" TO "anon";
GRANT ALL ON TABLE "public"."classifications" TO "authenticated";
GRANT ALL ON TABLE "public"."classifications" TO "service_role";



GRANT ALL ON TABLE "public"."licenses" TO "anon";
GRANT ALL ON TABLE "public"."licenses" TO "authenticated";
GRANT ALL ON TABLE "public"."licenses" TO "service_role";



GRANT ALL ON TABLE "public"."local_class_hierarchy" TO "anon";
GRANT ALL ON TABLE "public"."local_class_hierarchy" TO "authenticated";
GRANT ALL ON TABLE "public"."local_class_hierarchy" TO "service_role";



GRANT ALL ON TABLE "public"."local_class_links" TO "anon";
GRANT ALL ON TABLE "public"."local_class_links" TO "authenticated";
GRANT ALL ON TABLE "public"."local_class_links" TO "service_role";



GRANT ALL ON SEQUENCE "public"."local_class_local_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."local_class_local_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."local_class_local_seq" TO "service_role";



GRANT ALL ON TABLE "public"."objects" TO "anon";
GRANT ALL ON TABLE "public"."objects" TO "authenticated";
GRANT ALL ON TABLE "public"."objects" TO "service_role";



GRANT ALL ON TABLE "public"."local_class_object_counts_direct" TO "anon";
GRANT ALL ON TABLE "public"."local_class_object_counts_direct" TO "authenticated";
GRANT ALL ON TABLE "public"."local_class_object_counts_direct" TO "service_role";



GRANT ALL ON TABLE "public"."local_class_object_counts_total" TO "anon";
GRANT ALL ON TABLE "public"."local_class_object_counts_total" TO "authenticated";
GRANT ALL ON TABLE "public"."local_class_object_counts_total" TO "service_role";



GRANT ALL ON TABLE "public"."local_classes" TO "anon";
GRANT ALL ON TABLE "public"."local_classes" TO "authenticated";
GRANT ALL ON TABLE "public"."local_classes" TO "service_role";



GRANT ALL ON TABLE "public"."local_counters" TO "anon";
GRANT ALL ON TABLE "public"."local_counters" TO "authenticated";
GRANT ALL ON TABLE "public"."local_counters" TO "service_role";



GRANT ALL ON TABLE "public"."location_media_links" TO "anon";
GRANT ALL ON TABLE "public"."location_media_links" TO "authenticated";
GRANT ALL ON TABLE "public"."location_media_links" TO "service_role";



GRANT ALL ON TABLE "public"."locations" TO "anon";
GRANT ALL ON TABLE "public"."locations" TO "authenticated";
GRANT ALL ON TABLE "public"."locations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."media_local_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."media_local_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."media_local_seq" TO "service_role";



GRANT ALL ON TABLE "public"."media" TO "anon";
GRANT ALL ON TABLE "public"."media" TO "authenticated";
GRANT ALL ON TABLE "public"."media" TO "service_role";



GRANT ALL ON TABLE "public"."object_classifications" TO "anon";
GRANT ALL ON TABLE "public"."object_classifications" TO "authenticated";
GRANT ALL ON TABLE "public"."object_classifications" TO "service_role";



GRANT ALL ON TABLE "public"."object_media_links" TO "anon";
GRANT ALL ON TABLE "public"."object_media_links" TO "authenticated";
GRANT ALL ON TABLE "public"."object_media_links" TO "service_role";



GRANT ALL ON TABLE "public"."object_preferred_classification" TO "anon";
GRANT ALL ON TABLE "public"."object_preferred_classification" TO "authenticated";
GRANT ALL ON TABLE "public"."object_preferred_classification" TO "service_role";



GRANT ALL ON TABLE "public"."redirects" TO "anon";
GRANT ALL ON TABLE "public"."redirects" TO "authenticated";
GRANT ALL ON TABLE "public"."redirects" TO "service_role";



GRANT ALL ON TABLE "public"."tea_schools" TO "anon";
GRANT ALL ON TABLE "public"."tea_schools" TO "authenticated";
GRANT ALL ON TABLE "public"."tea_schools" TO "service_role";



GRANT ALL ON TABLE "public"."valuations" TO "anon";
GRANT ALL ON TABLE "public"."valuations" TO "authenticated";
GRANT ALL ON TABLE "public"."valuations" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






RESET ALL;
