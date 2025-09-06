# Production Migration Procedure

## Overview

This document provides the complete step-by-step procedure for executing the database migration consolidation in the production Supabase environment.

## Pre-Migration Prerequisites

### Environment Setup
- [ ] Supabase CLI authenticated and tested
- [ ] Production project access verified
- [ ] Local development environment with consolidated migration tested
- [ ] Team communication channels established (Slack, etc.)
- [ ] Downtime window scheduled and communicated to users

### Required Resources
- [ ] Project maintainer with production access
- [ ] Backup verification completed
- [ ] Emergency contacts available
- [ ] Rollback procedures tested and ready

## Migration Timeline

### Recommended Window: Low-traffic period (weekends/evenings)
**Total Estimated Time**: 2-3 hours including verification

```
T-120 min: Begin preparation phase
T-60 min:  Execute comprehensive backup
T-30 min:  Verify backup integrity  
T-15 min:  Final system checks
T-0:       Begin migration execution
T+30 min:  Migration completion and verification
T+60 min:  Application testing and validation
T+90 min:  Monitor production stability
```

## Step-by-Step Migration Procedure

### Phase 1: Pre-Migration Preparation (T-120 to T-15)

#### Step 1: Environment Verification (T-120 min)
```bash
# Verify Supabase CLI access
supabase --version
supabase login --check

# Confirm project access
supabase projects list
export SUPABASE_PROJECT_REF="your-production-project-ref"

# Test connection
supabase db dump --project-ref $SUPABASE_PROJECT_REF --schema-only --dry-run
```

#### Step 2: User Communication (T-90 min)
- [ ] Post maintenance notification to users
- [ ] Update status page (if applicable)
- [ ] Notify team members of migration start
- [ ] Set application to maintenance mode (if required)

#### Step 3: Comprehensive Backup (T-60 min)
```bash
# Execute the production backup script
./scripts/production_backup.sh

# Expected output:
# - Full database backup
# - Schema-only backup
# - Data-only backup
# - Individual table backups
# - Backup verification report
```

#### Step 4: Backup Verification (T-30 min)
```bash
# Verify backup file integrity
BACKUP_DIR="backups/production_migration_$(date +%Y%m%d)"

for file in ${BACKUP_DIR}/*.sql; do
    if [ -s "$file" ]; then
        echo "✅ $file - OK ($(wc -l < "$file") lines)"
    else
        echo "❌ $file - EMPTY OR MISSING"
        exit 1
    fi
done

# Test critical table data
psql -f "${BACKUP_DIR}/table_objects_backup.sql" $TEST_DATABASE_URL
psql $TEST_DATABASE_URL -c "SELECT count(*) FROM objects;"
```

#### Step 5: Final System Checks (T-15 min)
```bash
# Check current migration status
supabase migration list --project-ref $SUPABASE_PROJECT_REF

# Verify no pending changes
git status

# Confirm consolidated migration file ready
ls -la supabase/migrations/20250906200000_consolidated_baseline.sql
```

### Phase 2: Migration Execution (T-0 to T+30)

#### Step 6: Begin Migration (T-0)
```bash
echo "🚀 Starting production migration at $(date)"

# Set maintenance mode (application-specific)
# curl -X POST https://your-app.com/admin/maintenance-mode

# Apply the consolidated migration
supabase db push --project-ref $SUPABASE_PROJECT_REF

# Expected behavior:
# - Existing tables will show "already exists, skipping"  
# - New indexes/constraints will be added idempotently
# - RLS policies will be created with existence checks
# - Functions will be updated with security fixes
```

#### Step 7: Monitor Migration Progress (T+0 to T+15)
```bash
# Watch migration logs
supabase logs --project-ref $SUPABASE_PROJECT_REF --filter database

# Check for errors
tail -f migration_logs.txt | grep -i error
```

#### Step 8: Verify Migration Completion (T+15)
```bash
# Check migration status
supabase migration list --project-ref $SUPABASE_PROJECT_REF

# Verify schema structure
supabase db dump --project-ref $SUPABASE_PROJECT_REF --schema-only > post_migration_schema.sql

# Compare with expected schema
diff consolidated_schema.sql post_migration_schema.sql
```

### Phase 3: Post-Migration Validation (T+30 to T+60)

#### Step 9: Database Integrity Checks (T+30)
```bash
# Verify data counts match pre-migration
supabase db remote --project-ref $SUPABASE_PROJECT_REF psql -c "
SELECT 'objects' as table_name, count(*) FROM objects 
UNION ALL SELECT 'media', count(*) FROM media 
UNION ALL SELECT 'accounts', count(*) FROM accounts 
UNION ALL SELECT 'chakai', count(*) FROM chakai 
UNION ALL SELECT 'local_classes', count(*) FROM local_classes;"

# Check foreign key constraints
supabase db remote --project-ref $SUPABASE_PROJECT_REF psql -c "
SELECT conname, contype FROM pg_constraint WHERE contype = 'f';"

# Verify RLS policies
supabase db remote --project-ref $SUPABASE_PROJECT_REF psql -c "
SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';"
```

#### Step 10: Function and Trigger Validation (T+35)
```bash
# Test critical functions
supabase db remote --project-ref $SUPABASE_PROJECT_REF psql -c "
SELECT swap_local_class_sort_order(
  (SELECT id FROM local_classes LIMIT 1),
  (SELECT id FROM local_classes OFFSET 1 LIMIT 1)
);"

# Verify triggers are active
supabase db remote --project-ref $SUPABASE_PROJECT_REF psql -c "
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname LIKE '%local_class%';"
```

#### Step 11: Application Functionality Testing (T+40)
```bash
# Remove maintenance mode
# curl -X DELETE https://your-app.com/admin/maintenance-mode

# Test critical application endpoints
curl -f https://your-app.com/api/health
curl -f https://your-app.com/api/objects?limit=1
curl -f https://your-app.com/api/chakai?limit=1

# Verify authentication still works
# (Manual testing recommended)
```

### Phase 4: Production Monitoring (T+60 to T+120)

#### Step 12: System Monitoring (T+60)
```bash
# Monitor application logs
supabase logs --project-ref $SUPABASE_PROJECT_REF --filter api

# Check error rates
# Monitor application performance metrics
# Verify user authentication success rates
```

#### Step 13: User Acceptance (T+90)
- [ ] Test user login functionality
- [ ] Verify tea ceremony object browsing
- [ ] Test admin functionality (local classes management)
- [ ] Confirm chakai (tea gathering) features work
- [ ] Validate media upload/viewing

#### Step 14: Migration Success Confirmation (T+120)
```bash
echo "✅ Migration completed successfully at $(date)"

# Document final status
cat > migration_completion_report.md << EOF
# Migration Completion Report

**Date**: $(date)
**Migration**: 20250906200000_consolidated_baseline.sql
**Status**: SUCCESS ✅

## Data Verification
- Objects: $(supabase db remote --project-ref $SUPABASE_PROJECT_REF psql -t -c "SELECT count(*) FROM objects;")
- Media: $(supabase db remote --project-ref $SUPABASE_PROJECT_REF psql -t -c "SELECT count(*) FROM media;")  
- Accounts: $(supabase db remote --project-ref $SUPABASE_PROJECT_REF psql -t -c "SELECT count(*) FROM accounts;")
- Chakai: $(supabase db remote --project-ref $SUPABASE_PROJECT_REF psql -t -c "SELECT count(*) FROM chakai;")
- Local Classes: $(supabase db remote --project-ref $SUPABASE_PROJECT_REF psql -t -c "SELECT count(*) FROM local_classes;")

## Application Status
- Authentication: ✅ Working
- Object browsing: ✅ Working
- Admin functions: ✅ Working
- Media handling: ✅ Working

## Next Steps
- Continue monitoring for 24 hours
- Archive migration backups
- Update documentation
EOF
```

## Error Handling During Migration

### Common Issues and Solutions

#### Migration Fails Due to Constraint Conflict
```bash
# Check specific error
supabase logs --project-ref $SUPABASE_PROJECT_REF --filter database | tail -20

# Manual constraint resolution if needed
supabase db remote --project-ref $SUPABASE_PROJECT_REF psql -c "
-- Drop problematic constraint
ALTER TABLE table_name DROP CONSTRAINT constraint_name;

-- Re-add constraint
ALTER TABLE table_name ADD CONSTRAINT constraint_name FOREIGN KEY (column) REFERENCES other_table(id);
"
```

#### RLS Policy Creation Failure
```bash
# Check existing policies
supabase db remote --project-ref $SUPABASE_PROJECT_REF psql -c "
SELECT policyname FROM pg_policies WHERE tablename = 'table_name';
"

# Drop and recreate if needed
supabase db remote --project-ref $SUPABASE_PROJECT_REF psql -c "
DROP POLICY IF EXISTS policy_name ON table_name;
CREATE POLICY policy_name ON table_name FOR SELECT USING (true);
"
```

### Emergency Procedures

#### Partial Rollback (Application Issues)
```bash
# If application has issues but database is stable
# Revert application code while keeping new schema

git checkout previous-stable-commit
# Deploy previous application version
# Database schema remains consolidated
```

#### Full Rollback (Critical Database Issues)
```bash
# EMERGENCY ONLY - Follow rollback procedure document
./scripts/emergency_rollback.sh
```

## Success Criteria

### Migration Considered Successful When:
- [ ] All migration steps complete without errors
- [ ] Data integrity verified (row counts match)
- [ ] All foreign key constraints intact
- [ ] RLS policies functioning correctly
- [ ] Application functionality fully operational
- [ ] User authentication working
- [ ] No critical errors in application logs
- [ ] Performance metrics within acceptable range

### Post-Migration Monitoring
- **24 hours**: Intensive monitoring of all systems
- **72 hours**: Continue error rate monitoring
- **1 week**: Performance and stability assessment
- **1 month**: Archive migration artifacts and finalize documentation

## Communication Plan

### During Migration
- Real-time updates to team Slack channel
- Status updates every 30 minutes
- Immediate notification of any issues

### Post-Migration
- Success confirmation to all stakeholders
- User notification of service restoration
- Documentation updates and lessons learned

This comprehensive procedure ensures a systematic, safe migration with multiple verification points and clear success criteria.