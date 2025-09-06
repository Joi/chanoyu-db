--
-- PostgreSQL database dump
--

\restrict SxNqf3Q5WdhF2VO1mrBsUAqyxZrqhfXJhmZamP2B9Qc4k2AnBKuZXjPcOJltQaJ

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: lc_after_insert(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.lc_after_insert() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
    -- Update sort_order for new local_classes entries
    UPDATE public.local_classes 
    SET sort_order = (
        SELECT COALESCE(MAX(sort_order), 0) + 1 
        FROM public.local_classes 
        WHERE parent_id = NEW.parent_id
    )
    WHERE id = NEW.id AND sort_order IS NULL;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.lc_after_insert() OWNER TO postgres;

--
-- Name: FUNCTION lc_after_insert(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.lc_after_insert() IS 'Trigger function for local_classes after insert - secured against search_path attacks';


--
-- Name: lc_before_update_parent(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.lc_before_update_parent() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
    -- Handle parent_id changes in local_classes
    IF OLD.parent_id != NEW.parent_id THEN
        -- Reset sort_order when parent changes
        NEW.sort_order := NULL;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.lc_before_update_parent() OWNER TO postgres;

--
-- Name: FUNCTION lc_before_update_parent(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.lc_before_update_parent() IS 'Trigger function for local_classes before parent update - secured against search_path attacks';


--
-- Name: set_local_class_local_number(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_local_class_local_number() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
    -- This is a trigger function for setting local numbers
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_local_class_local_number() OWNER TO postgres;

--
-- Name: set_local_class_local_number(integer, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_local_class_local_number(class_id integer, new_local_number text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
    UPDATE public.local_classes 
    SET local_number = new_local_number 
    WHERE id = class_id;
END;
$$;


ALTER FUNCTION public.set_local_class_local_number(class_id integer, new_local_number text) OWNER TO postgres;

--
-- Name: FUNCTION set_local_class_local_number(class_id integer, new_local_number text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.set_local_class_local_number(class_id integer, new_local_number text) IS 'Updates local number for local class - secured against search_path attacks';


--
-- Name: swap_local_class_sort_order(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.swap_local_class_sort_order(item1_id integer, item2_id integer) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
    item1_order integer;
    item2_order integer;
BEGIN
    -- Get current sort_order values
    SELECT sort_order INTO item1_order FROM public.local_classes WHERE id = item1_id;
    SELECT sort_order INTO item2_order FROM public.local_classes WHERE id = item2_id;
    
    -- Swap the sort_order values
    UPDATE public.local_classes SET sort_order = item2_order WHERE id = item1_id;
    UPDATE public.local_classes SET sort_order = item1_order WHERE id = item2_id;
END;
$$;


ALTER FUNCTION public.swap_local_class_sort_order(item1_id integer, item2_id integer) OWNER TO postgres;

--
-- Name: FUNCTION swap_local_class_sort_order(item1_id integer, item2_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.swap_local_class_sort_order(item1_id integer, item2_id integer) IS 'Swaps sort order between two local class items - secured against search_path attacks';


--
-- Name: swap_local_class_sort_order(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.swap_local_class_sort_order(class_id_1 uuid, class_id_2 uuid) RETURNS TABLE(success boolean, error_message text, class1_old_sort integer, class1_new_sort integer, class2_old_sort integer, class2_new_sort integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
    item1_order integer;
    item2_order integer;
BEGIN
    -- Get current sort_order values
    SELECT sort_order INTO item1_order FROM public.local_classes WHERE id = class_id_1;
    SELECT sort_order INTO item2_order FROM public.local_classes WHERE id = class_id_2;
    
    -- Swap the sort_order values
    UPDATE public.local_classes SET sort_order = item2_order WHERE id = class_id_1;
    UPDATE public.local_classes SET sort_order = item1_order WHERE id = class_id_2;
    
    -- Return success information
    RETURN QUERY SELECT true, null::text, item1_order, item2_order, item2_order, item1_order;
END;
$$;


ALTER FUNCTION public.swap_local_class_sort_order(class_id_1 uuid, class_id_2 uuid) OWNER TO postgres;

--
-- Name: FUNCTION swap_local_class_sort_order(class_id_1 uuid, class_id_2 uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.swap_local_class_sort_order(class_id_1 uuid, class_id_2 uuid) IS 'Atomically swaps sort_order between two top-level local_classes. Used for reordering functionality in admin interface.';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    full_name_en text,
    full_name_ja text,
    role text DEFAULT 'user'::text NOT NULL,
    password_hash text,
    tea_school_id uuid,
    tea_school text,
    tea_school_ja text,
    website text,
    bio text,
    bio_ja text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.accounts OWNER TO postgres;

--
-- Name: chakai; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chakai (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    local_number text NOT NULL,
    event_date date NOT NULL,
    start_time time without time zone,
    location_id uuid,
    visibility text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name_en text,
    name_ja text,
    token text
);


ALTER TABLE public.chakai OWNER TO postgres;

--
-- Name: chakai_attendees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chakai_attendees (
    chakai_id uuid NOT NULL,
    account_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.chakai_attendees OWNER TO postgres;

--
-- Name: chakai_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chakai_items (
    chakai_id uuid NOT NULL,
    object_id uuid NOT NULL,
    role text DEFAULT 'used'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.chakai_items OWNER TO postgres;

--
-- Name: chakai_media_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chakai_media_links (
    chakai_id uuid NOT NULL,
    media_id uuid NOT NULL,
    role text DEFAULT 'attachment'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.chakai_media_links OWNER TO postgres;

--
-- Name: classifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.classifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    label text NOT NULL,
    label_ja text,
    kind text NOT NULL,
    scheme text NOT NULL,
    uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.classifications OWNER TO postgres;

--
-- Name: licenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.licenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    uri text NOT NULL,
    summary text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.licenses OWNER TO postgres;

--
-- Name: local_class_hierarchy; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.local_class_hierarchy (
    ancestor_id uuid NOT NULL,
    descendant_id uuid NOT NULL,
    depth integer NOT NULL
);


ALTER TABLE public.local_class_hierarchy OWNER TO postgres;

--
-- Name: local_class_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.local_class_links (
    local_class_id uuid NOT NULL,
    classification_id uuid NOT NULL,
    is_preferred boolean DEFAULT false,
    confidence smallint,
    note text
);


ALTER TABLE public.local_class_links OWNER TO postgres;

--
-- Name: local_class_local_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.local_class_local_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.local_class_local_seq OWNER TO postgres;

--
-- Name: objects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token text NOT NULL,
    ark_name text,
    naan text,
    local_number text,
    title text,
    title_ja text,
    visibility text DEFAULT 'draft'::text NOT NULL,
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
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.objects OWNER TO postgres;

--
-- Name: local_class_object_counts_direct; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.local_class_object_counts_direct AS
 SELECT primary_local_class_id AS local_class_id,
    count(*) AS object_count
   FROM public.objects
  WHERE (primary_local_class_id IS NOT NULL)
  GROUP BY primary_local_class_id;


ALTER VIEW public.local_class_object_counts_direct OWNER TO postgres;

--
-- Name: local_class_object_counts_total; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.local_class_object_counts_total AS
 SELECT h.ancestor_id AS local_class_id,
    count(o.id) AS object_count
   FROM (public.objects o
     JOIN public.local_class_hierarchy h ON ((h.descendant_id = o.primary_local_class_id)))
  GROUP BY h.ancestor_id;


ALTER VIEW public.local_class_object_counts_total OWNER TO postgres;

--
-- Name: local_classes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.local_classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token text,
    local_number text,
    label_en text,
    label_ja text,
    description text,
    parent_id uuid,
    preferred_classification_id uuid,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    sort_order integer,
    CONSTRAINT local_classes_status_check CHECK ((status = ANY (ARRAY['active'::text, 'draft'::text, 'deprecated'::text])))
);


ALTER TABLE public.local_classes OWNER TO postgres;

--
-- Name: local_counters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.local_counters (
    kind text NOT NULL,
    year integer NOT NULL,
    value integer NOT NULL
);


ALTER TABLE public.local_counters OWNER TO postgres;

--
-- Name: location_media_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.location_media_links (
    location_id uuid NOT NULL,
    media_id uuid NOT NULL,
    role text DEFAULT 'related'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.location_media_links OWNER TO postgres;

--
-- Name: locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    local_number text NOT NULL,
    name text NOT NULL,
    address text,
    url text,
    visibility text DEFAULT 'private'::text NOT NULL,
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
    token text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.locations OWNER TO postgres;

--
-- Name: media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    object_id uuid,
    kind text NOT NULL,
    uri text NOT NULL,
    source text,
    width integer,
    height integer,
    license text,
    sort_order integer,
    copyright_owner text,
    rights_note text,
    license_id uuid,
    bucket text,
    storage_path text,
    visibility text DEFAULT 'private'::text NOT NULL,
    local_number text,
    token text,
    file_type text,
    file_size bigint,
    original_filename text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.media OWNER TO postgres;

--
-- Name: TABLE media; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.media IS 'Media files with RLS enabled for security compliance';


--
-- Name: media_local_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.media_local_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.media_local_seq OWNER TO postgres;

--
-- Name: object_classifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.object_classifications (
    object_id uuid NOT NULL,
    classification_id uuid NOT NULL,
    role text DEFAULT 'classification'::text NOT NULL
);


ALTER TABLE public.object_classifications OWNER TO postgres;

--
-- Name: object_media_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.object_media_links (
    object_id uuid NOT NULL,
    media_id uuid NOT NULL,
    role text DEFAULT 'related'::text
);


ALTER TABLE public.object_media_links OWNER TO postgres;

--
-- Name: redirects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.redirects (
    old_path text NOT NULL,
    new_path text NOT NULL
);


ALTER TABLE public.redirects OWNER TO postgres;

--
-- Name: tea_schools; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tea_schools (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name_en text NOT NULL,
    name_ja text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tea_schools OWNER TO postgres;

--
-- Name: valuations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.valuations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    object_id uuid NOT NULL,
    as_of_date date NOT NULL,
    currency text NOT NULL,
    amount numeric(18,2) NOT NULL,
    source text,
    source_url text,
    visibility text DEFAULT 'private'::text NOT NULL
);


ALTER TABLE public.valuations OWNER TO postgres;

--
-- Name: accounts accounts_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_email_key UNIQUE (email);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: chakai_attendees chakai_attendees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chakai_attendees
    ADD CONSTRAINT chakai_attendees_pkey PRIMARY KEY (chakai_id, account_id);


--
-- Name: chakai_items chakai_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chakai_items
    ADD CONSTRAINT chakai_items_pkey PRIMARY KEY (chakai_id, object_id);


--
-- Name: chakai_media_links chakai_media_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chakai_media_links
    ADD CONSTRAINT chakai_media_links_pkey PRIMARY KEY (chakai_id, media_id);


--
-- Name: chakai chakai_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chakai
    ADD CONSTRAINT chakai_pkey PRIMARY KEY (id);


--
-- Name: classifications classifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classifications
    ADD CONSTRAINT classifications_pkey PRIMARY KEY (id);


--
-- Name: licenses licenses_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_code_key UNIQUE (code);


--
-- Name: licenses licenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_pkey PRIMARY KEY (id);


--
-- Name: local_class_hierarchy local_class_hierarchy_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.local_class_hierarchy
    ADD CONSTRAINT local_class_hierarchy_pkey PRIMARY KEY (ancestor_id, descendant_id);


--
-- Name: local_class_links local_class_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.local_class_links
    ADD CONSTRAINT local_class_links_pkey PRIMARY KEY (local_class_id, classification_id);


--
-- Name: local_classes local_classes_local_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.local_classes
    ADD CONSTRAINT local_classes_local_number_key UNIQUE (local_number);


--
-- Name: local_classes local_classes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.local_classes
    ADD CONSTRAINT local_classes_pkey PRIMARY KEY (id);


--
-- Name: local_classes local_classes_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.local_classes
    ADD CONSTRAINT local_classes_token_key UNIQUE (token);


--
-- Name: local_counters local_counters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.local_counters
    ADD CONSTRAINT local_counters_pkey PRIMARY KEY (kind, year);


--
-- Name: location_media_links location_media_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.location_media_links
    ADD CONSTRAINT location_media_links_pkey PRIMARY KEY (location_id, media_id);


--
-- Name: locations locations_local_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_local_number_key UNIQUE (local_number);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: locations locations_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_token_key UNIQUE (token);


--
-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (id);


--
-- Name: media media_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_token_key UNIQUE (token);


--
-- Name: object_classifications object_classifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.object_classifications
    ADD CONSTRAINT object_classifications_pkey PRIMARY KEY (object_id, classification_id);


--
-- Name: object_media_links object_media_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.object_media_links
    ADD CONSTRAINT object_media_links_pkey PRIMARY KEY (object_id, media_id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: objects objects_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.objects
    ADD CONSTRAINT objects_token_key UNIQUE (token);


--
-- Name: redirects redirects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.redirects
    ADD CONSTRAINT redirects_pkey PRIMARY KEY (old_path);


--
-- Name: tea_schools tea_schools_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tea_schools
    ADD CONSTRAINT tea_schools_pkey PRIMARY KEY (id);


--
-- Name: valuations valuations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.valuations
    ADD CONSTRAINT valuations_pkey PRIMARY KEY (id);


--
-- Name: accounts_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX accounts_email_idx ON public.accounts USING btree (email);


--
-- Name: chakai_items_chakai_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX chakai_items_chakai_idx ON public.chakai_items USING btree (chakai_id);


--
-- Name: chakai_items_object_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX chakai_items_object_idx ON public.chakai_items USING btree (object_id);


--
-- Name: chakai_local_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX chakai_local_number_key ON public.chakai USING btree (local_number);


--
-- Name: chakai_token_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX chakai_token_unique ON public.chakai USING btree (token);


--
-- Name: classifications_scheme_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX classifications_scheme_idx ON public.classifications USING btree (scheme);


--
-- Name: cml_chakai_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cml_chakai_idx ON public.chakai_media_links USING btree (chakai_id);


--
-- Name: cml_media_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cml_media_idx ON public.chakai_media_links USING btree (media_id);


--
-- Name: idx_chakai_event_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chakai_event_date ON public.chakai USING btree (event_date);


--
-- Name: idx_chakai_visibility; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chakai_visibility ON public.chakai USING btree (visibility);


--
-- Name: lch_ancestor_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lch_ancestor_idx ON public.local_class_hierarchy USING btree (ancestor_id);


--
-- Name: lch_descendant_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lch_descendant_idx ON public.local_class_hierarchy USING btree (descendant_id);


--
-- Name: lcl_class_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lcl_class_idx ON public.local_class_links USING btree (classification_id);


--
-- Name: local_classes_local_number_ci; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX local_classes_local_number_ci ON public.local_classes USING btree (lower(local_number)) WHERE (local_number IS NOT NULL);


--
-- Name: local_classes_parent_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX local_classes_parent_idx ON public.local_classes USING btree (parent_id);


--
-- Name: local_classes_sort_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX local_classes_sort_order_idx ON public.local_classes USING btree (sort_order, local_number);


--
-- Name: media_object_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX media_object_id_idx ON public.media USING btree (object_id);


--
-- Name: media_visibility_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX media_visibility_idx ON public.media USING btree (visibility);


--
-- Name: objects_local_number_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX objects_local_number_idx ON public.objects USING btree (local_number);


--
-- Name: objects_token_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX objects_token_idx ON public.objects USING btree (token);


--
-- Name: objects_visibility_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX objects_visibility_idx ON public.objects USING btree (visibility);


--
-- Name: local_classes trg_lc_after_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_lc_after_insert AFTER INSERT ON public.local_classes FOR EACH ROW EXECUTE FUNCTION public.lc_after_insert();


--
-- Name: local_classes trg_lc_before_update_parent; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_lc_before_update_parent BEFORE UPDATE OF parent_id ON public.local_classes FOR EACH ROW EXECUTE FUNCTION public.lc_before_update_parent();


--
-- Name: local_classes trg_local_class_local_number; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_local_class_local_number BEFORE INSERT ON public.local_classes FOR EACH ROW EXECUTE FUNCTION public.set_local_class_local_number();


--
-- Name: accounts accounts_tea_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_tea_school_id_fkey FOREIGN KEY (tea_school_id) REFERENCES public.tea_schools(id);


--
-- Name: chakai_attendees chakai_attendees_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chakai_attendees
    ADD CONSTRAINT chakai_attendees_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: chakai_attendees chakai_attendees_chakai_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chakai_attendees
    ADD CONSTRAINT chakai_attendees_chakai_id_fkey FOREIGN KEY (chakai_id) REFERENCES public.chakai(id) ON DELETE CASCADE;


--
-- Name: chakai_items chakai_items_chakai_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chakai_items
    ADD CONSTRAINT chakai_items_chakai_id_fkey FOREIGN KEY (chakai_id) REFERENCES public.chakai(id) ON DELETE CASCADE;


--
-- Name: chakai_items chakai_items_object_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chakai_items
    ADD CONSTRAINT chakai_items_object_id_fkey FOREIGN KEY (object_id) REFERENCES public.objects(id) ON DELETE CASCADE;


--
-- Name: chakai chakai_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chakai
    ADD CONSTRAINT chakai_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;


--
-- Name: chakai_media_links chakai_media_links_chakai_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chakai_media_links
    ADD CONSTRAINT chakai_media_links_chakai_id_fkey FOREIGN KEY (chakai_id) REFERENCES public.chakai(id) ON DELETE CASCADE;


--
-- Name: chakai_media_links chakai_media_links_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chakai_media_links
    ADD CONSTRAINT chakai_media_links_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media(id) ON DELETE CASCADE;


--
-- Name: local_class_hierarchy local_class_hierarchy_ancestor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.local_class_hierarchy
    ADD CONSTRAINT local_class_hierarchy_ancestor_id_fkey FOREIGN KEY (ancestor_id) REFERENCES public.local_classes(id) ON DELETE CASCADE;


--
-- Name: local_class_hierarchy local_class_hierarchy_descendant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.local_class_hierarchy
    ADD CONSTRAINT local_class_hierarchy_descendant_id_fkey FOREIGN KEY (descendant_id) REFERENCES public.local_classes(id) ON DELETE CASCADE;


--
-- Name: local_class_links local_class_links_classification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.local_class_links
    ADD CONSTRAINT local_class_links_classification_id_fkey FOREIGN KEY (classification_id) REFERENCES public.classifications(id) ON DELETE CASCADE;


--
-- Name: local_class_links local_class_links_local_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.local_class_links
    ADD CONSTRAINT local_class_links_local_class_id_fkey FOREIGN KEY (local_class_id) REFERENCES public.local_classes(id) ON DELETE CASCADE;


--
-- Name: local_classes local_classes_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.local_classes
    ADD CONSTRAINT local_classes_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.local_classes(id) ON DELETE SET NULL;


--
-- Name: local_classes local_classes_preferred_classification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.local_classes
    ADD CONSTRAINT local_classes_preferred_classification_id_fkey FOREIGN KEY (preferred_classification_id) REFERENCES public.classifications(id) ON DELETE SET NULL;


--
-- Name: location_media_links location_media_links_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.location_media_links
    ADD CONSTRAINT location_media_links_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;


--
-- Name: location_media_links location_media_links_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.location_media_links
    ADD CONSTRAINT location_media_links_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media(id) ON DELETE CASCADE;


--
-- Name: media media_license_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_license_id_fkey FOREIGN KEY (license_id) REFERENCES public.licenses(id);


--
-- Name: media media_object_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_object_id_fkey FOREIGN KEY (object_id) REFERENCES public.objects(id) ON DELETE CASCADE;


--
-- Name: object_classifications object_classifications_classification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.object_classifications
    ADD CONSTRAINT object_classifications_classification_id_fkey FOREIGN KEY (classification_id) REFERENCES public.classifications(id) ON DELETE CASCADE;


--
-- Name: object_classifications object_classifications_object_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.object_classifications
    ADD CONSTRAINT object_classifications_object_id_fkey FOREIGN KEY (object_id) REFERENCES public.objects(id) ON DELETE CASCADE;


--
-- Name: object_media_links object_media_links_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.object_media_links
    ADD CONSTRAINT object_media_links_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media(id) ON DELETE CASCADE;


--
-- Name: object_media_links object_media_links_object_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.object_media_links
    ADD CONSTRAINT object_media_links_object_id_fkey FOREIGN KEY (object_id) REFERENCES public.objects(id) ON DELETE CASCADE;


--
-- Name: valuations valuations_object_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.valuations
    ADD CONSTRAINT valuations_object_id_fkey FOREIGN KEY (object_id) REFERENCES public.objects(id) ON DELETE CASCADE;


--
-- Name: chakai_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.chakai_items ENABLE ROW LEVEL SECURITY;

--
-- Name: chakai_items chakai_items_admin_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY chakai_items_admin_read ON public.chakai_items FOR SELECT USING ((((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin'::text));


--
-- Name: chakai_items chakai_items_admin_write; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY chakai_items_admin_write ON public.chakai_items USING ((((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin'::text));


--
-- Name: chakai_items chakai_items_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY chakai_items_read ON public.chakai_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.chakai c
  WHERE ((c.id = chakai_items.chakai_id) AND ((c.visibility = 'open'::text) OR ((c.visibility = 'members'::text) AND (EXISTS ( SELECT 1
           FROM (public.chakai_attendees ca
             JOIN public.accounts a ON ((a.id = ca.account_id)))
          WHERE ((ca.chakai_id = c.id) AND (a.email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)))))))))));


--
-- Name: chakai_media_links; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.chakai_media_links ENABLE ROW LEVEL SECURITY;

--
-- Name: chakai_media_links chakai_media_links_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY chakai_media_links_read ON public.chakai_media_links FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.chakai c
  WHERE ((c.id = chakai_media_links.chakai_id) AND ((c.visibility = 'open'::text) OR ((c.visibility = 'members'::text) AND (EXISTS ( SELECT 1
           FROM (public.chakai_attendees ca
             JOIN public.accounts a ON ((a.id = ca.account_id)))
          WHERE ((ca.chakai_id = c.id) AND (a.email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)))))))))));


--
-- Name: local_class_hierarchy; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.local_class_hierarchy ENABLE ROW LEVEL SECURITY;

--
-- Name: local_class_hierarchy local_class_hierarchy_public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY local_class_hierarchy_public_read ON public.local_class_hierarchy FOR SELECT USING (true);


--
-- Name: local_class_links; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.local_class_links ENABLE ROW LEVEL SECURITY;

--
-- Name: local_class_links local_class_links_public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY local_class_links_public_read ON public.local_class_links FOR SELECT USING (true);


--
-- Name: local_classes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.local_classes ENABLE ROW LEVEL SECURITY;

--
-- Name: local_classes local_classes_admin_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY local_classes_admin_all ON public.local_classes USING (true) WITH CHECK (true);


--
-- Name: POLICY local_classes_admin_all ON local_classes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY local_classes_admin_all ON public.local_classes IS 'Allows all operations on local_classes. Authorization is handled by requireAdmin() in application layer using supabaseAdmin client.';


--
-- Name: local_classes local_classes_public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY local_classes_public_read ON public.local_classes FOR SELECT USING (true);


--
-- Name: media; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

--
-- Name: media media_public_read_chakai; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY media_public_read_chakai ON public.media FOR SELECT USING (((EXISTS ( SELECT 1
   FROM (public.chakai_media_links cml
     JOIN public.chakai c ON ((c.id = cml.chakai_id)))
  WHERE ((cml.media_id = media.id) AND (c.visibility = 'open'::text) AND (media.visibility = 'public'::text)))) OR (EXISTS ( SELECT 1
   FROM (((public.chakai_media_links cml
     JOIN public.chakai c ON ((c.id = cml.chakai_id)))
     JOIN public.chakai_attendees ca ON ((ca.chakai_id = c.id)))
     JOIN public.accounts a ON ((a.id = ca.account_id)))
  WHERE ((cml.media_id = media.id) AND (c.visibility = 'members'::text) AND (a.email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) AND ((media.visibility = 'public'::text) OR (media.visibility = 'private'::text)))))));


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION lc_after_insert(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.lc_after_insert() TO anon;
GRANT ALL ON FUNCTION public.lc_after_insert() TO authenticated;
GRANT ALL ON FUNCTION public.lc_after_insert() TO service_role;


--
-- Name: FUNCTION lc_before_update_parent(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.lc_before_update_parent() TO anon;
GRANT ALL ON FUNCTION public.lc_before_update_parent() TO authenticated;
GRANT ALL ON FUNCTION public.lc_before_update_parent() TO service_role;


--
-- Name: FUNCTION set_local_class_local_number(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.set_local_class_local_number() TO anon;
GRANT ALL ON FUNCTION public.set_local_class_local_number() TO authenticated;
GRANT ALL ON FUNCTION public.set_local_class_local_number() TO service_role;


--
-- Name: FUNCTION set_local_class_local_number(class_id integer, new_local_number text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.set_local_class_local_number(class_id integer, new_local_number text) TO anon;
GRANT ALL ON FUNCTION public.set_local_class_local_number(class_id integer, new_local_number text) TO authenticated;
GRANT ALL ON FUNCTION public.set_local_class_local_number(class_id integer, new_local_number text) TO service_role;


--
-- Name: FUNCTION swap_local_class_sort_order(item1_id integer, item2_id integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.swap_local_class_sort_order(item1_id integer, item2_id integer) TO anon;
GRANT ALL ON FUNCTION public.swap_local_class_sort_order(item1_id integer, item2_id integer) TO authenticated;
GRANT ALL ON FUNCTION public.swap_local_class_sort_order(item1_id integer, item2_id integer) TO service_role;


--
-- Name: FUNCTION swap_local_class_sort_order(class_id_1 uuid, class_id_2 uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.swap_local_class_sort_order(class_id_1 uuid, class_id_2 uuid) TO anon;
GRANT ALL ON FUNCTION public.swap_local_class_sort_order(class_id_1 uuid, class_id_2 uuid) TO authenticated;
GRANT ALL ON FUNCTION public.swap_local_class_sort_order(class_id_1 uuid, class_id_2 uuid) TO service_role;


--
-- Name: TABLE accounts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.accounts TO anon;
GRANT ALL ON TABLE public.accounts TO authenticated;
GRANT ALL ON TABLE public.accounts TO service_role;


--
-- Name: TABLE chakai; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.chakai TO anon;
GRANT ALL ON TABLE public.chakai TO authenticated;
GRANT ALL ON TABLE public.chakai TO service_role;


--
-- Name: TABLE chakai_attendees; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.chakai_attendees TO anon;
GRANT ALL ON TABLE public.chakai_attendees TO authenticated;
GRANT ALL ON TABLE public.chakai_attendees TO service_role;


--
-- Name: TABLE chakai_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.chakai_items TO anon;
GRANT ALL ON TABLE public.chakai_items TO authenticated;
GRANT ALL ON TABLE public.chakai_items TO service_role;


--
-- Name: TABLE chakai_media_links; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.chakai_media_links TO anon;
GRANT ALL ON TABLE public.chakai_media_links TO authenticated;
GRANT ALL ON TABLE public.chakai_media_links TO service_role;


--
-- Name: TABLE classifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.classifications TO anon;
GRANT ALL ON TABLE public.classifications TO authenticated;
GRANT ALL ON TABLE public.classifications TO service_role;


--
-- Name: TABLE licenses; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.licenses TO anon;
GRANT ALL ON TABLE public.licenses TO authenticated;
GRANT ALL ON TABLE public.licenses TO service_role;


--
-- Name: TABLE local_class_hierarchy; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.local_class_hierarchy TO anon;
GRANT ALL ON TABLE public.local_class_hierarchy TO authenticated;
GRANT ALL ON TABLE public.local_class_hierarchy TO service_role;


--
-- Name: TABLE local_class_links; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.local_class_links TO anon;
GRANT ALL ON TABLE public.local_class_links TO authenticated;
GRANT ALL ON TABLE public.local_class_links TO service_role;


--
-- Name: SEQUENCE local_class_local_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.local_class_local_seq TO anon;
GRANT ALL ON SEQUENCE public.local_class_local_seq TO authenticated;
GRANT ALL ON SEQUENCE public.local_class_local_seq TO service_role;


--
-- Name: TABLE objects; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.objects TO anon;
GRANT ALL ON TABLE public.objects TO authenticated;
GRANT ALL ON TABLE public.objects TO service_role;


--
-- Name: TABLE local_class_object_counts_direct; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.local_class_object_counts_direct TO anon;
GRANT ALL ON TABLE public.local_class_object_counts_direct TO authenticated;
GRANT ALL ON TABLE public.local_class_object_counts_direct TO service_role;


--
-- Name: TABLE local_class_object_counts_total; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.local_class_object_counts_total TO anon;
GRANT ALL ON TABLE public.local_class_object_counts_total TO authenticated;
GRANT ALL ON TABLE public.local_class_object_counts_total TO service_role;


--
-- Name: TABLE local_classes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.local_classes TO anon;
GRANT ALL ON TABLE public.local_classes TO authenticated;
GRANT ALL ON TABLE public.local_classes TO service_role;


--
-- Name: TABLE local_counters; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.local_counters TO anon;
GRANT ALL ON TABLE public.local_counters TO authenticated;
GRANT ALL ON TABLE public.local_counters TO service_role;


--
-- Name: TABLE location_media_links; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.location_media_links TO anon;
GRANT ALL ON TABLE public.location_media_links TO authenticated;
GRANT ALL ON TABLE public.location_media_links TO service_role;


--
-- Name: TABLE locations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.locations TO anon;
GRANT ALL ON TABLE public.locations TO authenticated;
GRANT ALL ON TABLE public.locations TO service_role;


--
-- Name: TABLE media; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.media TO anon;
GRANT ALL ON TABLE public.media TO authenticated;
GRANT ALL ON TABLE public.media TO service_role;


--
-- Name: SEQUENCE media_local_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.media_local_seq TO anon;
GRANT ALL ON SEQUENCE public.media_local_seq TO authenticated;
GRANT ALL ON SEQUENCE public.media_local_seq TO service_role;


--
-- Name: TABLE object_classifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.object_classifications TO anon;
GRANT ALL ON TABLE public.object_classifications TO authenticated;
GRANT ALL ON TABLE public.object_classifications TO service_role;


--
-- Name: TABLE object_media_links; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.object_media_links TO anon;
GRANT ALL ON TABLE public.object_media_links TO authenticated;
GRANT ALL ON TABLE public.object_media_links TO service_role;


--
-- Name: TABLE redirects; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.redirects TO anon;
GRANT ALL ON TABLE public.redirects TO authenticated;
GRANT ALL ON TABLE public.redirects TO service_role;


--
-- Name: TABLE tea_schools; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tea_schools TO anon;
GRANT ALL ON TABLE public.tea_schools TO authenticated;
GRANT ALL ON TABLE public.tea_schools TO service_role;


--
-- Name: TABLE valuations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.valuations TO anon;
GRANT ALL ON TABLE public.valuations TO authenticated;
GRANT ALL ON TABLE public.valuations TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict SxNqf3Q5WdhF2VO1mrBsUAqyxZrqhfXJhmZamP2B9Qc4k2AnBKuZXjPcOJltQaJ

