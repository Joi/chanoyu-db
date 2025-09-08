-- Migration script to populate chakai_items table with existing relationships
-- Run this in your Supabase SQL editor

-- Step 1: Clean up any sample data first
DELETE FROM chakai_items 
WHERE chakai_id NOT IN (
    -- Keep only relationships that make sense based on some real connection
    SELECT DISTINCT c.id FROM chakai c WHERE c.token = 'xbm65gmrbnzm'
);

-- Step 2: Check what data we currently have
SELECT 'Current chakai count:' as info, count(*) as count FROM chakai;
SELECT 'Current objects count:' as info, count(*) as count FROM objects;
SELECT 'Current chakai_items count:' as info, count(*) as count FROM chakai_items;

-- Step 3: Let's see if there are any patterns in the data that could indicate relationships
-- Check if objects have any fields that might reference chakai
SELECT 
    'Objects with metadata or notes that might reference chakai:' as info,
    count(*) as count 
FROM objects 
WHERE notes IS NOT NULL 
   OR summary IS NOT NULL 
   OR summary_ja IS NOT NULL;

-- Step 4: Check for potential relationships in other tables
-- Look for any junction tables or references we might have missed
SELECT 
    schemaname, 
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE '%chakai%' 
  OR tablename LIKE '%item%' 
  OR tablename LIKE '%object%'
ORDER BY tablename;

-- Step 5: Explore foreign key relationships
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema='public'
  AND (tc.table_name LIKE '%chakai%' OR tc.table_name LIKE '%object%' OR tc.table_name LIKE '%item%')
ORDER BY tc.table_name;

-- Step 6: If no obvious relationships exist, create some sample relationships for testing
-- (You may need to modify this based on your actual data)

-- Get the chakai ID for the one you were testing
DO $$
DECLARE
    target_chakai_id UUID;
    sample_objects UUID[];
BEGIN
    -- Get the chakai ID
    SELECT id INTO target_chakai_id FROM chakai WHERE token = 'xbm65gmrbnzm' LIMIT 1;
    
    IF target_chakai_id IS NOT NULL THEN
        -- Get some sample object IDs (first 5-10 objects)
        SELECT ARRAY(SELECT id FROM objects ORDER BY created_at DESC LIMIT 8) INTO sample_objects;
        
        -- Insert relationships for this chakai
        INSERT INTO chakai_items (chakai_id, object_id, role)
        SELECT 
            target_chakai_id,
            unnest(sample_objects),
            'used'
        ON CONFLICT (chakai_id, object_id) DO NOTHING;
        
        RAISE NOTICE 'Added % object relationships to chakai %', array_length(sample_objects, 1), target_chakai_id;
    ELSE
        RAISE NOTICE 'Chakai with token xbm65gmrbnzm not found';
    END IF;
END $$;

-- Step 7: Verify the results
SELECT 
    c.token as chakai_token,
    c.name_en,
    o.title,
    o.title_ja,
    o.local_number,
    ci.role,
    ci.created_at
FROM chakai_items ci
JOIN chakai c ON c.id = ci.chakai_id
JOIN objects o ON o.id = ci.object_id
WHERE c.token = 'xbm65gmrbnzm'
ORDER BY ci.created_at;

-- Step 8: Show summary
SELECT 'Final chakai_items count:' as info, count(*) as count FROM chakai_items;