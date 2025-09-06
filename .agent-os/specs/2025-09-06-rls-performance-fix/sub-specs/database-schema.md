# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-09-06-rls-performance-fix/spec.md

> Created: 2025-09-06
> Version: 1.0.0

## Schema Changes

### Current RLS Policy Structure

**chakai_items table (3 policies to consolidate):**
- `chakai_items_admin_read`: Allows admin read access
- `chakai_items_admin_write`: Allows admin write access  
- `chakai_items_read`: Allows general read access

**local_classes table (2 policies to consolidate):**
- `local_classes_admin_all`: Allows admin full access
- `local_classes_public_read`: Allows public read access

### Proposed Consolidated Structure

**chakai_items table (consolidated to 2 policies):**
- `chakai_items_read_optimized`: Combined read access for both admin and general users
- `chakai_items_write_optimized`: Admin write access only

**local_classes table (consolidated to 1 policy):**
- `local_classes_access_optimized`: Combined read/write access with role-based conditions

### Policy Logic Consolidation

**Before (chakai_items):**
```sql
-- Policy 1: Admin read
CREATE POLICY chakai_items_admin_read ON chakai_items FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Policy 2: Admin write  
CREATE POLICY chakai_items_admin_write ON chakai_items FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Policy 3: General read
CREATE POLICY chakai_items_read ON chakai_items FOR SELECT
  USING (some_read_condition);
```

**After (chakai_items):**
```sql
-- Consolidated read policy
CREATE POLICY chakai_items_read_optimized ON chakai_items FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    some_read_condition
  );

-- Consolidated write policy
CREATE POLICY chakai_items_write_optimized ON chakai_items FOR INSERT, UPDATE, DELETE
  USING (auth.jwt() ->> 'role' = 'admin');
```

## Migrations

### Forward Migration Steps
1. **Backup existing policies**: Document current policy definitions
2. **Drop existing policies**: Remove overlapping policies safely
3. **Create consolidated policies**: Implement optimized versions
4. **Enable RLS**: Ensure RLS remains enabled throughout process
5. **Verify access patterns**: Test all existing application flows

### Rollback Migration Steps
1. **Drop consolidated policies**: Remove new optimized policies
2. **Restore original policies**: Recreate exact original policy structure
3. **Verify rollback success**: Ensure original functionality restored

### Migration Safety
- All migrations will be tested in local Docker environment first
- Production deployment during low-traffic maintenance window
- Database backup taken immediately before migration
- Rollback script prepared and tested before deployment
- Post-migration verification checklist for all user access scenarios