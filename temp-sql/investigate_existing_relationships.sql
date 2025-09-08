-- Investigation script to find how items were originally linked to chakai
-- Run this to understand the existing data structure

-- Step 1: Check if objects table has a direct chakai reference
SELECT 
    'Objects table columns:' as info,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'objects' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check if there's any metadata/notes that reference chakai
SELECT 
    'Objects with potential chakai references in notes:' as info,
    COUNT(*) as count
FROM objects 
WHERE notes ILIKE '%chakai%' 
   OR notes ILIKE '%tea%' 
   OR notes ILIKE '%ceremony%'
   OR summary ILIKE '%chakai%';

-- Show examples
SELECT 
    'Sample objects with chakai references:' as info,
    token, 
    title, 
    title_ja,
    substring(notes from 1 for 100) as notes_preview
FROM objects 
WHERE notes ILIKE '%chakai%' 
   OR notes ILIKE '%tea%' 
   OR summary ILIKE '%chakai%'
LIMIT 5;

-- Step 3: Check if there are other linking tables
SELECT 
    'All tables containing chakai or item:' as info,
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'public'
  AND (tablename LIKE '%chakai%' 
       OR tablename LIKE '%item%' 
       OR tablename LIKE '%object%'
       OR tablename LIKE '%event%'
       OR tablename LIKE '%link%')
ORDER BY tablename;

-- Step 4: Look for any foreign key references to chakai from objects
SELECT 
    'Foreign keys from objects table:' as info,
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name = 'objects'
ORDER BY kcu.column_name;

-- Step 5: Check specific chakai to see if it should have many objects
SELECT 
    'Target chakai details:' as info,
    id,
    token, 
    name_en,
    name_ja,
    event_date,
    visibility,
    notes
FROM chakai 
WHERE token = 'xbm65gmrbnzm';

-- Step 6: See current chakai_items state
SELECT 
    'Current chakai_items for this chakai:' as info,
    COUNT(*) as item_count
FROM chakai_items ci
JOIN chakai c ON c.id = ci.chakai_id
WHERE c.token = 'xbm65gmrbnzm';

-- Show the current items
SELECT 
    'Current linked objects:' as info,
    o.token,
    o.title,
    o.title_ja,
    o.local_number
FROM chakai_items ci
JOIN chakai c ON c.id = ci.chakai_id  
JOIN objects o ON o.id = ci.object_id
WHERE c.token = 'xbm65gmrbnzm'
ORDER BY o.title;