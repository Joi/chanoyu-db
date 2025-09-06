-- Consolidate RLS policies for performance optimization
-- 
-- This migration consolidates overlapping permissive RLS policies to reduce
-- evaluation overhead while maintaining identical security boundaries.
--
-- Changes:
-- - chakai_items: 4 policies to 2 policies (consolidate 3 SELECT policies)
-- - local_classes: 2 policies to 1 policy (consolidate all policies)

BEGIN;

-- ============================================================================
-- chakai_items table: Consolidate 4 to 2 policies
-- ============================================================================

-- Drop existing overlapping SELECT policies (all 3 SELECT policies)
DROP POLICY IF EXISTS "chakai_items_admin_read" ON "public"."chakai_items";
DROP POLICY IF EXISTS "chakai_items_parent_guard" ON "public"."chakai_items";
DROP POLICY IF EXISTS "chakai_items_read" ON "public"."chakai_items";

-- Create consolidated read policy combining all SELECT access patterns
CREATE POLICY "chakai_items_read_optimized" ON "public"."chakai_items"
AS PERMISSIVE FOR SELECT
TO public
USING (
  -- Admin access (covers both JWT formats for admin/owner roles)
  (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin'::text)
  OR
  (current_setting('request.jwt.claim.role'::text, true) = ANY (ARRAY['admin'::text, 'owner'::text]))
  OR
  -- Chakai visibility-based access (consolidated from parent_guard and chakai_items_read)
  (EXISTS ( SELECT 1
     FROM chakai c
    WHERE c.id = chakai_items.chakai_id AND (
           (c.visibility = 'open'::text) 
           OR 
           (c.visibility = 'members'::text AND 
            (current_setting('request.jwt.claim.role'::text, true) = ANY (ARRAY['admin'::text, 'owner'::text]) OR
             EXISTS ( SELECT 1
                FROM chakai_attendees ca
                  JOIN accounts a ON (a.id = ca.account_id)
               WHERE ca.chakai_id = c.id AND 
                     (a.email = current_setting('request.jwt.claim.sub'::text, true) OR
                      a.email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)))))
           OR
           (c.visibility = 'closed'::text AND 
            current_setting('request.jwt.claim.role'::text, true) = ANY (ARRAY['admin'::text, 'owner'::text])))))
);

-- Note: chakai_items_admin_write policy remains unchanged (already optimized)

-- ============================================================================
-- local_classes table: Consolidate 2 to 1 policy  
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "local_classes_admin_all" ON "public"."local_classes";
DROP POLICY IF EXISTS "local_classes_public_read" ON "public"."local_classes";

-- Create single optimized policy for all access
-- Both original policies had 'true' conditions, so consolidation is straightforward
CREATE POLICY "local_classes_access_optimized" ON "public"."local_classes"
AS PERMISSIVE FOR ALL
TO public
USING (true);

COMMIT;

-- ============================================================================
-- Migration validation queries (for manual verification)
-- ============================================================================

-- Verify policy counts after migration:
-- SELECT 'chakai_items_policies' as info, count(*) as policy_count FROM pg_policies WHERE tablename = 'chakai_items';
-- SELECT 'local_classes_policies' as info, count(*) as policy_count FROM pg_policies WHERE tablename = 'local_classes';

-- Verify policy names:
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename IN ('chakai_items', 'local_classes') ORDER BY tablename, policyname;