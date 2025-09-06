# RLS Policy Migration Plan

## Overview
Safe migration strategy to consolidate RLS policies while maintaining identical security boundaries and enabling rollback capabilities.

## Pre-Migration Checklist
- [ ] Local Supabase environment running (`supabase status`)
- [ ] Database backup created (for production deployment)
- [ ] Test suite available for regression testing
- [ ] Performance baseline measurements taken
- [ ] Rollback procedures documented and tested

## Migration Strategy

### Stage 1: Local Development & Testing

#### Step 1.1: Create Migration Files
```bash
# Create new migration
supabase migration new consolidate_rls_policies
```

#### Step 1.2: Test Current Policy Behavior (Baseline)
```sql
-- Test queries to establish baseline behavior
SELECT 'chakai_items' as table_name, count(*) as accessible_rows 
FROM chakai_items 
WHERE true; -- This will respect RLS

SELECT 'local_classes' as table_name, count(*) as accessible_rows
FROM local_classes 
WHERE true; -- This will respect RLS
```

#### Step 1.3: Atomic Policy Replacement
**Migration SQL (Up)**:
```sql
-- Transaction ensures atomic replacement
BEGIN;

-- chakai_items table: Drop old policies, create optimized
DROP POLICY IF EXISTS "chakai_items_admin_read" ON "public"."chakai_items";
DROP POLICY IF EXISTS "chakai_items_read" ON "public"."chakai_items";

CREATE POLICY "chakai_items_read_optimized" ON "public"."chakai_items"
AS PERMISSIVE FOR SELECT
TO public
USING (
  (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin'::text)
  OR
  (EXISTS ( SELECT 1
     FROM chakai c
    WHERE ((c.id = chakai_items.chakai_id) AND 
           ((c.visibility = 'open'::text) OR 
            ((c.visibility = 'members'::text) AND 
             (EXISTS ( SELECT 1
                FROM (chakai_attendees ca
                  JOIN accounts a ON ((a.id = ca.account_id)))
               WHERE ((ca.chakai_id = c.id) AND 
                      (a.email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text))))))))))
);

-- local_classes table: Drop old policies, create optimized  
DROP POLICY IF EXISTS "local_classes_admin_all" ON "public"."local_classes";
DROP POLICY IF EXISTS "local_classes_public_read" ON "public"."local_classes";

CREATE POLICY "local_classes_access_optimized" ON "public"."local_classes"
AS PERMISSIVE FOR ALL
TO public
USING (true);

COMMIT;
```

#### Step 1.4: Test Optimized Policy Behavior  
```sql
-- Verify identical results after migration
SELECT 'chakai_items' as table_name, count(*) as accessible_rows 
FROM chakai_items 
WHERE true; -- Should match baseline

SELECT 'local_classes' as table_name, count(*) as accessible_rows
FROM local_classes 
WHERE true; -- Should match baseline
```

#### Step 1.5: Performance Measurement
```sql
-- Measure query performance improvements
EXPLAIN ANALYZE SELECT * FROM chakai_items LIMIT 10;
EXPLAIN ANALYZE SELECT * FROM local_classes LIMIT 10;
```

### Stage 2: Rollback Capability

**Migration SQL (Down)**:
```sql
BEGIN;

-- Rollback to original policies
DROP POLICY IF EXISTS "chakai_items_read_optimized" ON "public"."chakai_items";
DROP POLICY IF EXISTS "local_classes_access_optimized" ON "public"."local_classes";

-- Restore original chakai_items policies
CREATE POLICY "chakai_items_admin_read" ON "public"."chakai_items"
AS PERMISSIVE FOR SELECT  
TO public
USING ((((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin'::text));

CREATE POLICY "chakai_items_read" ON "public"."chakai_items"
AS PERMISSIVE FOR SELECT
TO public  
USING ((EXISTS ( SELECT 1
   FROM chakai c
  WHERE ((c.id = chakai_items.chakai_id) AND 
         ((c.visibility = 'open'::text) OR 
          ((c.visibility = 'members'::text) AND 
           (EXISTS ( SELECT 1
              FROM (chakai_attendees ca
                JOIN accounts a ON ((a.id = ca.account_id)))
             WHERE ((ca.chakai_id = c.id) AND 
                    (a.email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text))))))))))));

-- Restore original local_classes policies
CREATE POLICY "local_classes_admin_all" ON "public"."local_classes"
AS PERMISSIVE FOR ALL
TO public
USING (true);

CREATE POLICY "local_classes_public_read" ON "public"."local_classes" 
AS PERMISSIVE FOR SELECT
TO public
USING (true);

COMMIT;
```

### Stage 3: Testing Framework

#### Regression Test Cases
1. **Admin User Tests**
   - Can read all chakai_items
   - Can modify all chakai_items  
   - Can access all local_classes

2. **Regular User Tests**
   - Can read open chakai items
   - Can read member chakai items they attend
   - Cannot read member chakai items they don't attend
   - Cannot modify chakai_items
   - Can read local_classes

3. **Anonymous User Tests**
   - Can read open chakai items only
   - Cannot modify anything
   - Can read local_classes

#### Performance Test Cases
1. **Query Performance**
   - Measure SELECT performance on chakai_items
   - Measure SELECT performance on local_classes
   - Compare before/after policy consolidation

2. **Policy Evaluation Count**
   - Verify reduced policy evaluation overhead
   - Monitor RLS engine performance metrics

### Stage 4: Production Deployment

#### Pre-Deployment
- [ ] Remote database backup completed
- [ ] Local testing passed 100%
- [ ] Performance improvements verified
- [ ] Rollback procedure tested locally

#### Deployment
- [ ] Apply migration to production
- [ ] Immediate smoke tests post-deployment
- [ ] Monitor error logs for RLS issues
- [ ] Verify Supabase performance warnings resolved

#### Post-Deployment
- [ ] Full regression test suite
- [ ] Performance monitoring
- [ ] User access verification
- [ ] Documentation updates

## Risk Mitigation

### Low Risk Items
- Migration is atomic (single transaction)
- Policies maintain identical logic
- Comprehensive rollback capability

### Medium Risk Items  
- Production deployment timing
- User session impact during migration

### Mitigation Strategies
- Deploy during low-traffic periods
- Monitor real-time for access control issues  
- Immediate rollback if unexpected behavior
- Pre-tested rollback procedures

## Success Criteria
- [ ] Zero functional changes to access control
- [ ] Reduced RLS policy evaluation overhead
- [ ] Supabase performance warnings resolved
- [ ] Full regression test suite passes
- [ ] Performance metrics show improvement