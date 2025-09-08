-- Clean up sample data and reset chakai_items for proper data entry
-- Run this in Supabase SQL editor

-- Step 1: Clear all current chakai_items (sample data)
DELETE FROM chakai_items;

-- Step 2: Verify it's empty
SELECT 'Chakai items after cleanup:' as info, count(*) as count FROM chakai_items;

-- Step 3: Show available chakai and objects for manual relationship building
SELECT 
    'Available chakai events:' as info,
    id,
    token, 
    name_en,
    name_ja,
    local_number,
    event_date
FROM chakai 
ORDER BY event_date DESC;

SELECT 
    'Available objects (first 20):' as info,
    id,
    token,
    title,
    title_ja,
    local_number
FROM objects 
ORDER BY created_at DESC
LIMIT 20;

-- Step 4: Example of how to add relationships manually
-- Copy and modify this template for each chakai-object relationship:

/*
-- Template for adding items to chakai:
INSERT INTO chakai_items (chakai_id, object_id, role) 
VALUES 
    ((SELECT id FROM chakai WHERE token = 'xbm65gmrbnzm'), (SELECT id FROM objects WHERE token = 'OBJECT_TOKEN_HERE'), 'used'),
    ((SELECT id FROM chakai WHERE token = 'xbm65gmrbnzm'), (SELECT id FROM objects WHERE local_number = 'ITO-I-2025-00123'), 'used');
-- Repeat for each object that belongs to this chakai
*/

-- Note: After adding relationships, both will work:
-- 1. Object admin page -> "Select Chakai events" (object → chakai direction)  
-- 2. Chakai admin/view pages -> "Items used" (chakai → object direction)