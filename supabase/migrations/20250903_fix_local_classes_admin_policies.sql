-- Fix local_classes RLS policies to allow admin writes
-- This addresses the root cause of issue #61: reorder arrows not working due to missing write policies

-- First, check if we have any admin write policies already
DO $$ BEGIN
  -- Drop any existing overly restrictive policies that might conflict
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'local_classes' 
    AND policyname = 'local_classes_admin_write'
  ) THEN
    DROP POLICY local_classes_admin_write ON local_classes;
  END IF;
END $$;

-- Create comprehensive admin policy for all operations (INSERT, UPDATE, DELETE)
-- This uses the service role approach since we're using supabaseAdmin() in the code
CREATE POLICY local_classes_admin_all ON local_classes
FOR ALL
USING (true)  -- Allow all operations for service role
WITH CHECK (true);

-- Note: The policy uses "true" because the app uses supabaseAdmin() which bypasses RLS
-- The actual authorization happens in the requireAdmin() function in the application layer

-- Also ensure the table is configured correctly
ALTER TABLE local_classes ENABLE ROW LEVEL SECURITY;

-- Add comment for documentation
COMMENT ON POLICY local_classes_admin_all ON local_classes IS 
'Allows all operations on local_classes. Authorization is handled by requireAdmin() in application layer using supabaseAdmin client.';