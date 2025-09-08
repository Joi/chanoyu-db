-- Sample script to add some chakai items for testing
-- Run this in your Supabase SQL editor

-- First, let's see what chakai and objects we have
SELECT 'Chakai:' as type, id, token, name_en, name_ja FROM chakai WHERE token = 'xbm65gmrbnzm' LIMIT 1;
SELECT 'Objects:' as type, id, token, title, title_ja, local_number FROM objects LIMIT 5;

-- Check current chakai_items
SELECT 'Current chakai_items:' as info, count(*) as count FROM chakai_items;

-- Let's add some sample associations (replace with actual IDs from the results above)
-- You'll need to run this part manually with the actual chakai ID and object IDs

/*
-- Example: Link the chakai to a few objects (replace with real IDs)
INSERT INTO chakai_items (chakai_id, object_id) 
SELECT 
    (SELECT id FROM chakai WHERE token = 'xbm65gmrbnzm'),
    objects.id
FROM objects 
LIMIT 3;
*/

-- Check the results
-- SELECT ci.*, c.token as chakai_token, o.title, o.title_ja 
-- FROM chakai_items ci
-- JOIN chakai c ON c.id = ci.chakai_id  
-- JOIN objects o ON o.id = ci.object_id
-- WHERE c.token = 'xbm65gmrbnzm';