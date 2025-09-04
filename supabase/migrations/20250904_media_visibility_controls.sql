-- Migration: Media visibility controls for chakaiki PDF access (MINIMAL)
-- Date: 2025-09-04
-- Description: Add minimal visibility controls to existing media table only

-- Add missing columns to existing media table
ALTER TABLE media ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'image';
ALTER TABLE media ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS original_filename TEXT;

-- Add file_type constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name LIKE '%file_type%' 
    AND table_name = 'media'
  ) THEN
    ALTER TABLE media ADD CONSTRAINT media_file_type_check 
      CHECK (file_type IN ('image', 'pdf'));
  END IF;
EXCEPTION
  WHEN others THEN
    NULL;
END $$;

-- Ensure existing media has public visibility (the visibility column should already exist)
UPDATE media SET visibility = 'public' WHERE visibility IS NULL;

-- Migration complete - minimal changes only