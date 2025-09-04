-- Migration: Media visibility controls for chakaiki PDF access
-- Date: 2025-09-04
-- Description: Add visibility controls to media tables and create chakai media infrastructure

-- Ensure chakai table exists (if not already created elsewhere)
CREATE TABLE IF NOT EXISTS chakai (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE,
  local_number TEXT,
  name_en TEXT,
  name_ja TEXT,
  event_date DATE,
  start_time TIME,
  end_time TIME,
  location_id UUID REFERENCES locations(id),
  visibility TEXT NOT NULL DEFAULT 'open' CHECK (visibility IN ('open', 'members', 'closed')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure chakai_attendees table exists
CREATE TABLE IF NOT EXISTS chakai_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chakai_id UUID NOT NULL REFERENCES chakai(id) ON DELETE CASCADE,
  user_id UUID,
  email TEXT,
  full_name_en TEXT,
  full_name_ja TEXT,
  role TEXT DEFAULT 'attendee' CHECK (role IN ('attendee', 'organizer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(chakai_id, email)
);

-- Create chakai_media table for PDF and other media attachments
CREATE TABLE IF NOT EXISTS chakai_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chakai_id UUID NOT NULL REFERENCES chakai(id) ON DELETE CASCADE,
  token TEXT UNIQUE,
  local_number TEXT,
  title TEXT,
  title_ja TEXT,
  file_type TEXT NOT NULL DEFAULT 'image' CHECK (file_type IN ('image', 'pdf')),
  file_size INTEGER,
  original_filename TEXT,
  storage_path TEXT NOT NULL,
  bucket TEXT NOT NULL DEFAULT 'chakai-media',
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure existing media table has all required visibility columns
ALTER TABLE media ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'image' CHECK (file_type IN ('image', 'pdf'));
ALTER TABLE media ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS original_filename TEXT;

-- Update visibility constraint on existing media table to match spec
DO $$ 
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE media DROP CONSTRAINT IF EXISTS media_visibility_check;
  
  -- Add the new constraint
  ALTER TABLE media ADD CONSTRAINT media_visibility_check 
    CHECK (visibility IN ('public', 'private'));
EXCEPTION
  WHEN others THEN
    NULL; -- Continue if constraint operations fail
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS chakai_event_date_idx ON chakai(event_date);
CREATE INDEX IF NOT EXISTS chakai_visibility_idx ON chakai(visibility);
CREATE INDEX IF NOT EXISTS chakai_attendees_chakai_id_idx ON chakai_attendees(chakai_id);
CREATE INDEX IF NOT EXISTS chakai_attendees_email_idx ON chakai_attendees(email);
CREATE INDEX IF NOT EXISTS chakai_media_chakai_id_idx ON chakai_media(chakai_id);
CREATE INDEX IF NOT EXISTS chakai_media_visibility_idx ON chakai_media(visibility);
CREATE INDEX IF NOT EXISTS chakai_media_file_type_idx ON chakai_media(file_type);

-- Create unique indexes for tokens and local_numbers
CREATE UNIQUE INDEX IF NOT EXISTS chakai_token_unique ON chakai(token) WHERE token IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS chakai_local_number_ci ON chakai(lower(local_number)) WHERE local_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS chakai_media_token_unique ON chakai_media(token) WHERE token IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS chakai_media_local_number_ci ON chakai_media(lower(local_number)) WHERE local_number IS NOT NULL;

-- Auto-numbering sequences and triggers for chakai
CREATE SEQUENCE IF NOT EXISTS chakai_local_seq;
CREATE SEQUENCE IF NOT EXISTS chakai_media_local_seq;

-- Function to set chakai local number
CREATE OR REPLACE FUNCTION set_chakai_local_number() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.local_number IS NULL THEN
    NEW.local_number := 'ITO-C-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('chakai_local_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to set chakai_media local number  
CREATE OR REPLACE FUNCTION set_chakai_media_local_number() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.local_number IS NULL THEN
    NEW.local_number := 'ITO-CM-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('chakai_media_local_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-numbering
DROP TRIGGER IF EXISTS trg_chakai_local_number ON chakai;
CREATE TRIGGER trg_chakai_local_number
  BEFORE INSERT ON chakai
  FOR EACH ROW EXECUTE FUNCTION set_chakai_local_number();

DROP TRIGGER IF EXISTS trg_chakai_media_local_number ON chakai_media;
CREATE TRIGGER trg_chakai_media_local_number
  BEFORE INSERT ON chakai_media
  FOR EACH ROW EXECUTE FUNCTION set_chakai_media_local_number();

-- Enable RLS on all tables
ALTER TABLE chakai ENABLE ROW LEVEL SECURITY;
ALTER TABLE chakai_attendees ENABLE ROW LEVEL SECURITY;  
ALTER TABLE chakai_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chakai table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chakai' AND policyname = 'chakai_public_read'
  ) THEN
    CREATE POLICY chakai_public_read ON chakai
      FOR SELECT USING (visibility = 'open');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chakai' AND policyname = 'chakai_members_read'
  ) THEN
    CREATE POLICY chakai_members_read ON chakai
      FOR SELECT USING (
        visibility = 'members' AND (
          -- User is authenticated and is an attendee of this chakai
          (auth.role() = 'authenticated' AND EXISTS (
            SELECT 1 FROM chakai_attendees ca 
            WHERE ca.chakai_id = chakai.id 
            AND ca.user_id = auth.uid()
          ))
          OR 
          -- User is the chakai creator
          (auth.role() = 'authenticated' AND created_by = auth.uid())
          OR
          -- Service role (admin access)
          auth.role() = 'service_role'
        )
      );
  END IF;
END $$;

DO $$ BEGIN  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chakai' AND policyname = 'chakai_owner_admin_read'
  ) THEN
    CREATE POLICY chakai_owner_admin_read ON chakai
      FOR SELECT USING (
        visibility = 'closed' AND (
          -- User is the chakai creator  
          (auth.role() = 'authenticated' AND created_by = auth.uid())
          OR
          -- Service role (admin access)
          auth.role() = 'service_role'
        )
      );
  END IF;
END $$;

-- RLS Policies for chakai_attendees table  
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chakai_attendees' AND policyname = 'chakai_attendees_chakai_visibility'
  ) THEN
    CREATE POLICY chakai_attendees_chakai_visibility ON chakai_attendees
      FOR SELECT USING (
        -- Only show attendees for chakai that the user can see
        EXISTS (
          SELECT 1 FROM chakai c 
          WHERE c.id = chakai_attendees.chakai_id
          AND (
            c.visibility = 'open'
            OR (c.visibility = 'members' AND (
              (auth.role() = 'authenticated' AND EXISTS (
                SELECT 1 FROM chakai_attendees ca2 
                WHERE ca2.chakai_id = c.id AND ca2.user_id = auth.uid()
              ))
              OR (auth.role() = 'authenticated' AND c.created_by = auth.uid())
              OR auth.role() = 'service_role'
            ))
            OR (c.visibility = 'closed' AND (
              (auth.role() = 'authenticated' AND c.created_by = auth.uid())
              OR auth.role() = 'service_role'
            ))
          )
        )
      );
  END IF;
END $$;

-- RLS Policies for chakai_media table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chakai_media' AND policyname = 'chakai_media_public_read'
  ) THEN
    CREATE POLICY chakai_media_public_read ON chakai_media
      FOR SELECT USING (
        visibility = 'public' AND EXISTS (
          SELECT 1 FROM chakai c 
          WHERE c.id = chakai_media.chakai_id
          AND c.visibility = 'open'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chakai_media' AND policyname = 'chakai_media_private_attendees'  
  ) THEN
    CREATE POLICY chakai_media_private_attendees ON chakai_media
      FOR SELECT USING (
        visibility = 'private' AND (
          -- User is authenticated and is an attendee of this chakai
          (auth.role() = 'authenticated' AND EXISTS (
            SELECT 1 FROM chakai_attendees ca 
            WHERE ca.chakai_id = chakai_media.chakai_id 
            AND ca.user_id = auth.uid()
          ))
          OR 
          -- User is the chakai creator
          (auth.role() = 'authenticated' AND EXISTS (
            SELECT 1 FROM chakai c 
            WHERE c.id = chakai_media.chakai_id 
            AND c.created_by = auth.uid()
          ))
          OR
          -- Service role (admin access)
          auth.role() = 'service_role'
        )
      );
  END IF;
END $$;

-- Update existing media to default to public visibility if NULL
UPDATE media SET visibility = 'public' WHERE visibility IS NULL;

-- Migration complete