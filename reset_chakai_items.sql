-- Simple script to clear chakai_items and start fresh
-- Run this in Supabase SQL editor, then manually add your real relationships

-- Clear all sample data
DELETE FROM chakai_items;

-- Verify it's empty
SELECT 'Chakai items count after reset:' as info, count(*) as count FROM chakai_items;

-- Show your chakai for reference
SELECT 
    'Your chakai (for reference):' as info,
    id,
    token, 
    name_en,
    name_ja,
    local_number
FROM chakai 
ORDER BY event_date DESC 
LIMIT 10;

-- Now you can manually add the real relationships using the object admin pages
-- or by inserting directly:
-- INSERT INTO chakai_items (chakai_id, object_id) VALUES 
-- ((SELECT id FROM chakai WHERE token = 'CHAKAI_TOKEN'), (SELECT id FROM objects WHERE token = 'OBJECT_TOKEN'));