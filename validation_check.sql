-- Post-migration validation queries
SELECT 'POST-MIGRATION DATA COUNTS' as status;

SELECT 'tea_schools' as table_name, count(*) as count FROM tea_schools 
UNION ALL SELECT 'accounts', count(*) FROM accounts 
UNION ALL SELECT 'locations', count(*) FROM locations 
UNION ALL SELECT 'chakai', count(*) FROM chakai 
UNION ALL SELECT 'chakai_attendees', count(*) FROM chakai_attendees
UNION ALL SELECT 'objects', count(*) FROM objects
UNION ALL SELECT 'media', count(*) FROM media
UNION ALL SELECT 'local_classes', count(*) FROM local_classes;

SELECT 'CONSTRAINT CHECK' as status;
SELECT count(*) as foreign_key_constraints FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public';

SELECT 'RLS POLICIES CHECK' as status;
SELECT count(*) as rls_policies FROM pg_policies WHERE schemaname = 'public';

SELECT 'MIGRATION VALIDATION COMPLETE' as status;
