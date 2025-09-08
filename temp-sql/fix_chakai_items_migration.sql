-- Fix chakai_items population - migrate from existing relationships
-- Run this in your Supabase SQL editor

-- Step 1: Clear any test/sample data
DELETE FROM chakai_items;

-- Step 2: Check current database state
SELECT 'Database state check:' as info;
SELECT 'Total chakai:' as type, count(*) as count FROM chakai;
SELECT 'Total objects:' as type, count(*) as count FROM objects;

-- Step 3: Look for existing relationship patterns
-- Check if objects table has any chakai-related fields
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'objects' 
  AND table_schema = 'public'
  AND (column_name LIKE '%chakai%' OR column_name LIKE '%event%')
ORDER BY column_name;

-- Step 4: Check if there's a many-to-many table we missed
SELECT 
    tablename
FROM pg_tables 
WHERE schemaname = 'public'
  AND (tablename LIKE '%chakai%' OR tablename LIKE '%object%' OR tablename LIKE '%event%' OR tablename LIKE '%item%')
ORDER BY tablename;

-- Step 5: If there was an existing relationship via metadata/notes, we'll need to migrate manually
-- For now, let's see what chakai and objects you have for the specific chakai you were testing

SELECT 
    'Chakai being tested:' as info,
    id, 
    token, 
    name_en, 
    name_ja,
    local_number,
    event_date
FROM chakai 
WHERE token = 'xbm65gmrbnzm';

-- Show some recent objects that might be candidates for this chakai
SELECT 
    'Recent objects (candidates for chakai):' as info,
    id,
    token,
    title,
    title_ja,
    local_number,
    created_at
FROM objects 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 6: Manual relationship creation for the test chakai
-- (Modify this section based on which objects should be linked to the chakai)

/*
-- Example: Link specific objects to the chakai
-- Replace the object tokens/IDs with the actual ones you want associated

INSERT INTO chakai_items (chakai_id, object_id, role) 
SELECT 
    (SELECT id FROM chakai WHERE token = 'xbm65gmrbnzm'),
    objects.id,
    'used'
FROM objects 
WHERE objects.token IN (
    'object_token_1',
    'object_token_2', 
    'object_token_3'
    -- Add the actual object tokens that should be linked to this chakai
)
ON CONFLICT (chakai_id, object_id) DO NOTHING;
*/

-- Step 7: Alternative - if you want to link the most recent objects as a test
INSERT INTO chakai_items (chakai_id, object_id, role)
SELECT 
    (SELECT id FROM chakai WHERE token = 'xbm65gmrbnzm'),
    o.id,
    'used'
FROM objects o
ORDER BY o.created_at DESC
LIMIT 5
ON CONFLICT (chakai_id, object_id) DO NOTHING;

-- Step 8: Verify the results
SELECT 
    c.token as chakai_token,
    c.name_en as chakai_name,
    o.title as object_title,
    o.title_ja as object_title_ja,
    o.local_number,
    ci.role
FROM chakai_items ci
JOIN chakai c ON c.id = ci.chakai_id
JOIN objects o ON o.id = ci.object_id
WHERE c.token = 'xbm65gmrbnzm'
ORDER BY o.title;

SELECT 'Final count:' as info, count(*) as chakai_items_count FROM chakai_items;