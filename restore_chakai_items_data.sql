-- Check what happened to the original chakai_items data
-- The table existed before - we need to restore/find the original relationships

-- Step 1: Check if the table structure is correct
SELECT 
    'chakai_items table structure:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'chakai_items' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check all current data in chakai_items
SELECT 
    'All current chakai_items data:' as info,
    ci.*,
    c.token as chakai_token,
    c.name_en as chakai_name,
    o.title as object_title,
    o.local_number as object_local_number
FROM chakai_items ci
LEFT JOIN chakai c ON c.id = ci.chakai_id
LEFT JOIN objects o ON o.id = ci.object_id
ORDER BY ci.created_at DESC;

-- Step 3: Check if there are objects that reference chakai but aren't in chakai_items
-- Look for any backup or alternative relationship storage

-- Check if objects table has any chakai reference columns
SELECT 
    'Objects table chakai-related columns:' as info,
    column_name
FROM information_schema.columns 
WHERE table_name = 'objects' 
  AND table_schema = 'public'
  AND column_name ILIKE '%chakai%'
ORDER BY column_name;

-- Step 4: Check for recent objects that might have been linked to chakai
-- Look at objects created around the same time as your chakai
SELECT 
    'Objects created around chakai date:' as info,
    COUNT(*) as count
FROM objects o
WHERE o.created_at >= (
    SELECT c.event_date - INTERVAL '30 days' 
    FROM chakai c 
    WHERE c.token = 'xbm65gmrbnzm'
)
AND o.created_at <= (
    SELECT c.event_date + INTERVAL '30 days' 
    FROM chakai c 
    WHERE c.token = 'xbm65gmrbnzm'
);

-- Step 5: Show objects that might belong to this chakai based on timing
SELECT 
    'Potential objects for this chakai (by date):' as info,
    o.id,
    o.token,
    o.title,
    o.title_ja,
    o.local_number,
    o.created_at
FROM objects o
WHERE o.created_at >= (
    SELECT c.event_date - INTERVAL '60 days' 
    FROM chakai c 
    WHERE c.token = 'xbm65gmrbnzm'
)
AND o.created_at <= (
    SELECT c.event_date + INTERVAL '30 days' 
    FROM chakai c 
    WHERE c.token = 'xbm65gmrbnzm'
)
ORDER BY o.created_at DESC;

-- Step 6: Check if there are any audit logs or backup tables
SELECT 
    'All tables in database:' as info,
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'public'
  AND (tablename LIKE '%audit%' 
       OR tablename LIKE '%log%' 
       OR tablename LIKE '%backup%'
       OR tablename LIKE '%history%')
ORDER BY tablename;