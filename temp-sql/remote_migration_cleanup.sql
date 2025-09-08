-- 1. First, check current migration history
SELECT version, inserted_at FROM supabase_migrations.schema_migrations ORDER BY version;

-- 2. Remove old individual migration entries (keep only the consolidated one)
DELETE FROM supabase_migrations.schema_migrations 
WHERE version IN (
    '20250818151956',
    '20250821_local_classes', 
    '20250903010000',
    '20250903020000', 
    '20250903030000',
    '20250903040000',
    '20250903050000', 
    '20250904_chakai_media_links',
    '20250905_chakai_items',
    '20250906_security_fixes'
);

-- 3. Ensure our consolidated migration is recorded
INSERT INTO supabase_migrations.schema_migrations (version, inserted_at) 
VALUES ('20250906200000', NOW()) 
ON CONFLICT (version) DO NOTHING;

-- 4. Verify final clean state  
SELECT version, inserted_at FROM supabase_migrations.schema_migrations ORDER BY version;
