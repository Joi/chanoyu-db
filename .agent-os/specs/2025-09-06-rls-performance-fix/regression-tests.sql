-- RLS Policy Regression Tests
-- Test consolidated policies maintain identical access control behavior

-- Test Setup: Create test data
BEGIN;

-- Insert test chakai records
INSERT INTO chakai (id, title, date, visibility) VALUES
    ('12345678-1234-1234-1234-123456789001', 'Open Test Chakai', '2025-01-15', 'open'),
    ('12345678-1234-1234-1234-123456789002', 'Members Test Chakai', '2025-01-16', 'members'),
    ('12345678-1234-1234-1234-123456789003', 'Private Test Chakai', '2025-01-17', 'private');

-- Insert test local_classes records  
INSERT INTO local_classes (id, name_en, name_ja, ordinal) VALUES
    ('12345678-1234-1234-1234-123456789101', 'Test Class 1', 'テストクラス1', 1),
    ('12345678-1234-1234-1234-123456789102', 'Test Class 2', 'テストクラス2', 2);

-- Insert test chakai_items records
INSERT INTO chakai_items (chakai_id, object_id) VALUES
    ('12345678-1234-1234-1234-123456789001', '12345678-1234-1234-1234-123456789201'), -- Open chakai
    ('12345678-1234-1234-1234-123456789002', '12345678-1234-1234-1234-123456789202'), -- Members chakai  
    ('12345678-1234-1234-1234-123456789003', '12345678-1234-1234-1234-123456789203'); -- Private chakai

COMMIT;

-- ============================================================================
-- TEST 1: Anonymous User Access (no JWT)
-- ============================================================================

-- Reset JWT claims to simulate anonymous user
SELECT set_config('request.jwt.claims', null, true);

-- Test chakai_items access (should only see open chakai items)
SELECT 'anon_chakai_items' as test, count(*) as accessible_rows 
FROM chakai_items;

-- Test local_classes access (should see all)
SELECT 'anon_local_classes' as test, count(*) as accessible_rows 
FROM local_classes;

-- ============================================================================
-- TEST 2: Regular User Access (authenticated but not admin)
-- ============================================================================

-- Set JWT claims for regular user
SELECT set_config('request.jwt.claims', '{"role":"authenticated","email":"test@example.com"}', true);

-- Test chakai_items access (should see open chakai items only, unless attending members chakai)
SELECT 'user_chakai_items' as test, count(*) as accessible_rows 
FROM chakai_items;

-- Test local_classes access (should see all)
SELECT 'user_local_classes' as test, count(*) as accessible_rows 
FROM local_classes;

-- ============================================================================  
-- TEST 3: Admin User Access (admin role)
-- ============================================================================

-- Set JWT claims for admin user  
SELECT set_config('request.jwt.claims', '{"role":"admin","email":"admin@example.com"}', true);

-- Test chakai_items access (should see all)
SELECT 'admin_chakai_items' as test, count(*) as accessible_rows 
FROM chakai_items;

-- Test local_classes access (should see all)
SELECT 'admin_local_classes' as test, count(*) as accessible_rows 
FROM local_classes;

-- ============================================================================
-- TEST 4: Write Operations
-- ============================================================================

-- Test chakai_items write (should only work for admin)
-- Regular user write test
SELECT set_config('request.jwt.claims', '{"role":"authenticated","email":"test@example.com"}', true);

-- This should fail for regular user
-- INSERT INTO chakai_items (chakai_id, object_id) VALUES ('12345678-1234-1234-1234-123456789001', '12345678-1234-1234-1234-123456789999');

-- Admin user write test
SELECT set_config('request.jwt.claims', '{"role":"admin","email":"admin@example.com"}', true);

-- This should succeed for admin user
INSERT INTO chakai_items (chakai_id, object_id) VALUES ('12345678-1234-1234-1234-123456789001', '12345678-1234-1234-1234-123456789999');

-- Clean up test write
DELETE FROM chakai_items WHERE object_id = '12345678-1234-1234-1234-123456789999';

-- Test local_classes write (should work for all users based on current policy)
INSERT INTO local_classes (id, name_en, ordinal) VALUES ('12345678-1234-1234-1234-123456789199', 'Test Write Class', 999);

-- Clean up test write  
DELETE FROM local_classes WHERE id = '12345678-1234-1234-1234-123456789199';

-- ============================================================================
-- CLEANUP: Remove test data
-- ============================================================================

DELETE FROM chakai_items WHERE chakai_id IN (
    '12345678-1234-1234-1234-123456789001', 
    '12345678-1234-1234-1234-123456789002', 
    '12345678-1234-1234-1234-123456789003'
);

DELETE FROM chakai WHERE id IN (
    '12345678-1234-1234-1234-123456789001',
    '12345678-1234-1234-1234-123456789002', 
    '12345678-1234-1234-1234-123456789003'
);

DELETE FROM local_classes WHERE id IN (
    '12345678-1234-1234-1234-123456789101',
    '12345678-1234-1234-1234-123456789102'
);

-- Reset JWT claims
SELECT set_config('request.jwt.claims', null, true);