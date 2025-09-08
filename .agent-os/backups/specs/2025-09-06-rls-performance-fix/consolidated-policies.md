# Consolidated RLS Policy Design

## Optimized Policy Structures

### chakai_items Table: 3 → 2 Policies

#### Current (3 policies):
```sql
-- Policy 1: chakai_items_admin_read (SELECT)
(((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin'::text)

-- Policy 2: chakai_items_admin_write (ALL)  
(((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin'::text)

-- Policy 3: chakai_items_read (SELECT)
(EXISTS ( SELECT 1 FROM chakai c WHERE ... complex visibility logic ... ))
```

#### Optimized (2 policies):
```sql
-- Policy 1: chakai_items_read_optimized (SELECT)
(
  -- Admin read access
  (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin'::text)
  OR
  -- General user read access
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
  )
)

-- Policy 2: chakai_items_admin_write (ALL - unchanged)
(((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin'::text)
```

**Performance Improvement**: 
- Admin users: 2 policy evaluations → 1 policy evaluation for reads
- Regular users: 2 policy evaluations → 1 policy evaluation for reads  
- Write operations unchanged (already optimized)

### local_classes Table: 2 → 1 Policy

#### Current (2 policies):
```sql
-- Policy 1: local_classes_admin_all (ALL)
true

-- Policy 2: local_classes_public_read (SELECT) 
true
```

#### Optimized (1 policy):
```sql
-- Policy 1: local_classes_access_optimized (ALL)
true
```

**Performance Improvement**:
- All operations: 2 policy evaluations → 1 policy evaluation
- Functionally identical (both current policies allow all access)

## Security Verification

### chakai_items Access Matrix

| User Type | Operation | Current Result | Optimized Result | Verification |
|-----------|-----------|----------------|------------------|--------------|
| Admin | SELECT | ✅ (via admin_read) | ✅ (via read_optimized OR clause) | ✅ Maintained |
| Admin | INSERT/UPDATE/DELETE | ✅ (via admin_write) | ✅ (via admin_write unchanged) | ✅ Maintained |
| Regular User | SELECT open chakai items | ✅ (via chakai_items_read) | ✅ (via read_optimized OR clause) | ✅ Maintained |
| Regular User | SELECT member chakai items (attending) | ✅ (via chakai_items_read) | ✅ (via read_optimized OR clause) | ✅ Maintained |
| Regular User | SELECT member chakai items (not attending) | ❌ (blocked by chakai_items_read) | ❌ (blocked by read_optimized OR clause) | ✅ Maintained |
| Regular User | INSERT/UPDATE/DELETE | ❌ (no policy allows) | ❌ (no policy allows) | ✅ Maintained |

### local_classes Access Matrix

| User Type | Operation | Current Result | Optimized Result | Verification |
|-----------|-----------|----------------|------------------|--------------|
| Any User | SELECT | ✅ (via public_read OR admin_all) | ✅ (via access_optimized) | ✅ Maintained |
| Any User | INSERT/UPDATE/DELETE | ✅ (via admin_all) | ✅ (via access_optimized) | ✅ Maintained |

## Migration Safety Plan

### Phase 1: Policy Addition (Safe)
1. Create new optimized policies alongside existing policies
2. Test new policies in isolation
3. Verify identical access patterns

### Phase 2: Policy Replacement (Atomic)
1. Drop old policies in single transaction
2. Activate new policies immediately
3. Rollback capability if issues arise

### Phase 3: Verification
1. Run regression tests
2. Measure performance improvements
3. Monitor for access control changes

## Implementation SQL

### Migration Up (Create Optimized Policies)
```sql
-- chakai_items: Create optimized read policy
CREATE POLICY "chakai_items_read_optimized" ON "public"."chakai_items"
AS PERMISSIVE FOR SELECT
TO public
USING (
  -- Admin read access
  (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin'::text)
  OR
  -- General user read access  
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
  )
);

-- local_classes: Create optimized access policy
CREATE POLICY "local_classes_access_optimized" ON "public"."local_classes"
AS PERMISSIVE FOR ALL
TO public
USING (true);
```

### Migration Down (Rollback to Original Policies)
```sql
-- Drop optimized policies
DROP POLICY IF EXISTS "chakai_items_read_optimized" ON "public"."chakai_items";
DROP POLICY IF EXISTS "local_classes_access_optimized" ON "public"."local_classes";

-- Recreate original policies
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

CREATE POLICY "local_classes_admin_all" ON "public"."local_classes"
AS PERMISSIVE FOR ALL
TO public
USING (true);

CREATE POLICY "local_classes_public_read" ON "public"."local_classes" 
AS PERMISSIVE FOR SELECT
TO public
USING (true);
```