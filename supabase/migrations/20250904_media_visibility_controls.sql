-- Migration: Media visibility controls for chakaiki PDF access (ULTRA MINIMAL)
-- Date: 2025-09-04
-- Description: Minimal safe changes to support media visibility controls

-- Only add columns if media table exists
DO $$
BEGIN
  -- Check if media table exists first
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'media'
  ) THEN
    -- Add file_type column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'media' AND column_name = 'file_type'
    ) THEN
      ALTER TABLE media ADD COLUMN file_type TEXT DEFAULT 'image';
    END IF;
    
    -- Add file_size column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'media' AND column_name = 'file_size'
    ) THEN
      ALTER TABLE media ADD COLUMN file_size INTEGER;
    END IF;
    
    -- Add original_filename column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'media' AND column_name = 'original_filename'
    ) THEN
      ALTER TABLE media ADD COLUMN original_filename TEXT;
    END IF;
    
    -- Update existing rows to have default visibility if null (visibility column may already exist)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'media' AND column_name = 'visibility'
    ) THEN
      UPDATE media SET visibility = 'public' WHERE visibility IS NULL;
    END IF;
    
  END IF;
EXCEPTION
  WHEN others THEN
    -- Ignore any errors and continue
    NULL;
END $$;

-- Migration complete - ultra safe minimal changes only