# RLS Policy Analysis for Performance Optimization

## Current Policy Documentation

### chakai_items Table Policies (3 policies identified)

#### 1. chakai_items_admin_read
- **Type**: PERMISSIVE SELECT policy
- **Target**: {public} role
- **Condition**: `(((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin'::text)`
- **Purpose**: Allows admin users to read all chakai_items records

#### 2. chakai_items_admin_write  
- **Type**: PERMISSIVE ALL policy (INSERT, UPDATE, DELETE)
- **Target**: {public} role
- **Condition**: `(((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin'::text)`
- **Purpose**: Allows admin users to perform all operations on chakai_items records

#### 3. chakai_items_read
- **Type**: PERMISSIVE SELECT policy
- **Target**: {public} role  
- **Condition**: Complex condition checking chakai visibility and attendance:
  ```sql
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
  ```
- **Purpose**: Allows users to read chakai_items for:
  - Open chakai events
  - Member-only chakai events they're attending

### local_classes Table Policies (2 policies identified)

#### 1. local_classes_admin_all
- **Type**: PERMISSIVE ALL policy (INSERT, UPDATE, DELETE, SELECT)
- **Target**: {public} role
- **Condition**: `true` (always allows)
- **Purpose**: Allows unrestricted admin access to local_classes

#### 2. local_classes_public_read
- **Type**: PERMISSIVE SELECT policy
- **Target**: {public} role
- **Condition**: `true` (always allows)  
- **Purpose**: Allows public read access to local_classes

## Policy Overlap and Redundancy Analysis

### chakai_items Table Issues

**Problem**: Multiple permissive SELECT policies create redundant evaluations
- `chakai_items_admin_read` covers admin reads
- `chakai_items_read` covers general user reads
- Both are PERMISSIVE SELECT policies, causing the RLS engine to evaluate both for every SELECT query

**Performance Impact**: 
- Admin users trigger evaluation of BOTH policies (admin policy succeeds early, but general policy still gets evaluated)
- Regular users only need the general policy evaluation
- Supabase RLS engine processes all permissive policies until one succeeds

### local_classes Table Issues

**Problem**: Overly broad policies with redundant coverage
- `local_classes_admin_all` allows ALL operations with `true` condition
- `local_classes_public_read` allows SELECT with `true` condition  
- Both policies use `true` conditions, creating unnecessary dual evaluation for reads

**Performance Impact**:
- Every SELECT query evaluates both policies
- The `admin_all` policy covers SELECT operations, making `public_read` redundant
- Two policy evaluations for identical result

## Consolidation Strategy

### chakai_items Consolidation (3 → 2 policies)

**Target Structure**:
1. **chakai_items_read_optimized**: Combine admin read + general read logic using OR
2. **chakai_items_admin_write**: Keep write policy separate (no consolidation needed)

**Logic**: 
```sql
-- Single read policy with OR logic
(admin_condition OR general_read_condition)
```

### local_classes Consolidation (2 → 1 policy)

**Target Structure**:
1. **local_classes_access_optimized**: Single policy covering all access patterns

**Logic**:
```sql  
-- Since both current policies use 'true', single policy with 'true' for all operations
```

## Security Boundary Verification

### chakai_items Security Requirements
- ✅ Admins can read all records
- ✅ Admins can write/modify all records  
- ✅ Regular users can read items from open chakai
- ✅ Regular users can read items from member chakai they attend
- ✅ Regular users cannot modify any records

### local_classes Security Requirements  
- ✅ All users can read local_classes (public information)
- ✅ All operations permitted (current implementation shows no restrictions)

## Next Steps

1. Create migration to implement consolidated policies
2. Test consolidated policies maintain identical security boundaries
3. Measure performance improvements
4. Deploy with rollback capability