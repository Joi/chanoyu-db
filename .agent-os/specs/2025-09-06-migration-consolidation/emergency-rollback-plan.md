# Emergency Rollback Plan

## Overview

This document provides comprehensive emergency rollback procedures for the database migration consolidation. Use these procedures only when the migration has caused critical issues that cannot be resolved through forward-fixes.

## Rollback Decision Matrix

### When to Execute Rollback

#### **IMMEDIATE ROLLBACK** (Critical Issues)
- ❌ Data corruption detected
- ❌ Authentication system failure
- ❌ Critical application functionality broken
- ❌ Foreign key constraint violations preventing normal operation
- ❌ RLS policies blocking legitimate user access

#### **FORWARD-FIX** (Preferred when possible)
- ⚠️ Minor performance degradation
- ⚠️ Non-critical feature issues
- ⚠️ Cosmetic UI problems
- ⚠️ Single table/feature affected

#### **MONITOR AND ASSESS**
- 🔍 Elevated error rates but service functional
- 🔍 User complaints but no data integrity issues
- 🔍 Performance issues that might resolve

## Rollback Types

### Type 1: Schema-Only Rollback (Safest)
**When**: Schema changes causing issues, data remains intact
**Risk Level**: Low
**Downtime**: 30-60 minutes

### Type 2: Partial Data Rollback (Moderate Risk)
**When**: Specific table data corrupted
**Risk Level**: Medium  
**Downtime**: 1-2 hours

### Type 3: Complete Database Restore (High Risk)
**When**: Complete system failure, widespread corruption
**Risk Level**: High
**Downtime**: 2-4 hours

## Emergency Contact Information

### Critical Personnel
- **Primary DBA**: [Contact info]
- **Application Lead**: [Contact info]  
- **DevOps Engineer**: [Contact info]
- **Project Owner**: [Contact info]

### Communication Channels
- **Emergency Slack**: #incident-response
- **Phone Tree**: [Emergency numbers]
- **Status Page**: [Status page URL]

## Rollback Procedures

### Type 1: Schema-Only Rollback

#### Prerequisites Check
```bash
# Verify backups are available
ls -la backups/production_migration_*/
cat backups/production_migration_*/backup_info.txt

# Confirm data integrity (before rollback)
supabase db remote --project-ref $SUPABASE_PROJECT_REF psql -c "
SELECT count(*) FROM objects UNION ALL 
SELECT count(*) FROM media UNION ALL 
SELECT count(*) FROM accounts;"
```

#### Step 1: Immediate Issue Assessment (5 minutes)
```bash
# Document current error state
supabase logs --project-ref $SUPABASE_PROJECT_REF --filter database | tail -50 > rollback_trigger_errors.log

# Check which tables are affected
supabase db remote --project-ref $SUPABASE_PROJECT_REF psql -c "\dt public.*"

# Test critical queries
supabase db remote --project-ref $SUPABASE_PROJECT_REF psql -c "SELECT 1 FROM objects LIMIT 1;"
```

#### Step 2: Set Maintenance Mode (2 minutes)
```bash
# Application maintenance mode
curl -X POST https://your-app.com/admin/maintenance-mode

# User communication
echo "🚨 EMERGENCY ROLLBACK IN PROGRESS - Database maintenance underway"
# Post to status page/user notification system
```

#### Step 3: Schema Restoration (15 minutes)
```bash
# Identify the pre-migration schema backup
BACKUP_DIR="backups/production_migration_$(date +%Y%m%d)"
PRE_MIGRATION_SCHEMA="${BACKUP_DIR}/schema_only_backup.sql"

# Create temporary database for validation
supabase db create-temp-db --name rollback_validation

# Test schema restore on temp database first
supabase db restore --temp-db rollback_validation --file $PRE_MIGRATION_SCHEMA

# If validation successful, apply to production
echo "⚠️  EXECUTING SCHEMA ROLLBACK - Point of no return"
supabase db remote --project-ref $SUPABASE_PROJECT_REF psql < $PRE_MIGRATION_SCHEMA
```

#### Step 4: Data Validation (10 minutes)
```bash
# Verify data integrity after schema rollback
supabase db remote --project-ref $SUPABASE_PROJECT_REF psql -c "
SELECT 'POST-ROLLBACK DATA COUNTS' as status;
SELECT 'objects' as table_name, count(*) FROM objects 
UNION ALL SELECT 'media', count(*) FROM media 
UNION ALL SELECT 'accounts', count(*) FROM accounts 
UNION ALL SELECT 'chakai', count(*) FROM chakai 
UNION ALL SELECT 'local_classes', count(*) FROM local_classes;"

# Test foreign key constraints
supabase db remote --project-ref $SUPABASE_PROJECT_REF psql -c "
SELECT conname FROM pg_constraint WHERE contype = 'f' AND conname LIKE '%_fkey';"
```

#### Step 5: Application Recovery (10 minutes)
```bash
# Remove maintenance mode
curl -X DELETE https://your-app.com/admin/maintenance-mode

# Test critical endpoints
curl -f https://your-app.com/api/health
curl -f https://your-app.com/api/objects?limit=1

# Monitor error rates
supabase logs --project-ref $SUPABASE_PROJECT_REF --filter api | tail -20
```

### Type 2: Partial Data Rollback

#### When to Use
- Specific table corruption after migration
- Data integrity issues in subset of tables
- Partial schema issues with localized impact

#### Procedure
```bash
# Identify affected tables
AFFECTED_TABLES=("table1" "table2" "table3")

for table in "${AFFECTED_TABLES[@]}"; do
    echo "Rolling back table: $table"
    
    # Drop current table data
    supabase db remote --project-ref $SUPABASE_PROJECT_REF psql -c "TRUNCATE TABLE $table CASCADE;"
    
    # Restore from backup
    supabase db remote --project-ref $SUPABASE_PROJECT_REF psql < "backups/production_migration_*/table_${table}_backup.sql"
    
    # Verify restoration
    supabase db remote --project-ref $SUPABASE_PROJECT_REF psql -c "SELECT count(*) FROM $table;"
done
```

### Type 3: Complete Database Restore

#### ⚠️ **LAST RESORT ONLY** ⚠️
**Risk**: Potential data loss for any changes since backup
**Use When**: Complete system failure, widespread corruption

#### Decision Checkpoint
```bash
# Before proceeding, confirm:
echo "CRITICAL DECISION POINT"
echo "Complete database restore will:"
echo "1. LOSE all data changes since backup was created"  
echo "2. Require 2-4 hours of downtime"
echo "3. May affect user authentication sessions"
echo ""
echo "Backup timestamp: $(cat backups/production_migration_*/backup_info.txt | grep 'Backup completed')"
echo ""
read -p "Type 'CONFIRM_FULL_RESTORE' to proceed: " confirmation

if [ "$confirmation" != "CONFIRM_FULL_RESTORE" ]; then
    echo "Rollback aborted"
    exit 1
fi
```

#### Complete Restore Procedure
```bash
# Extended maintenance mode
curl -X POST https://your-app.com/admin/maintenance-mode
echo "Database undergoing emergency restoration - extended downtime expected"

# Full database restoration
BACKUP_DIR="backups/production_migration_$(date +%Y%m%d)"
FULL_BACKUP="${BACKUP_DIR}/full_database_backup.sql"

# Clear current database (DESTRUCTIVE)
supabase db reset --project-ref $SUPABASE_PROJECT_REF --confirm

# Restore complete database
supabase db restore --project-ref $SUPABASE_PROJECT_REF --file $FULL_BACKUP

# Comprehensive validation (30+ minutes)
./scripts/full_database_validation.sh
```

## Rollback Validation Checklist

### Post-Rollback Verification
- [ ] **Data Integrity**: All table row counts match pre-migration backup
- [ ] **Authentication**: User login functionality working
- [ ] **Foreign Keys**: All relationships intact  
- [ ] **RLS Policies**: Access control functioning correctly
- [ ] **Application**: Critical features operational
- [ ] **Performance**: Response times within normal range
- [ ] **Error Rates**: Application errors back to baseline

### Extended Monitoring (24 hours)
- [ ] User authentication success rates
- [ ] Database query performance
- [ ] Application error logs
- [ ] User-reported issues
- [ ] Data consistency checks

## Post-Rollback Actions

### Immediate (0-2 hours)
1. **User Communication**: Notify users of service restoration
2. **Team Notification**: Update all stakeholders on rollback completion
3. **Incident Documentation**: Begin post-mortem documentation
4. **Monitoring Setup**: Enhanced monitoring for 24 hours

### Short Term (2-24 hours)  
1. **Root Cause Analysis**: Investigate what caused rollback need
2. **Migration Review**: Assess consolidated migration for issues
3. **Process Improvement**: Update migration procedures based on lessons learned
4. **Stakeholder Updates**: Provide detailed incident report

### Long Term (1-4 weeks)
1. **Migration Strategy Revision**: Update approach based on rollback experience
2. **Testing Enhancement**: Improve validation procedures
3. **Documentation Updates**: Revise all migration documentation
4. **Team Training**: Share lessons learned with team

## Prevention Strategies

### Future Migration Improvements
- **Staged Rollouts**: Deploy to staging environment first
- **Canary Deployments**: Gradual production deployment
- **Enhanced Testing**: More comprehensive pre-migration validation
- **Monitoring Alerts**: Better early warning systems
- **Rollback Automation**: Automated rollback triggers for critical issues

## Rollback Scripts

### Emergency Rollback Script
```bash
#!/bin/bash
# emergency_rollback.sh

set -e

ROLLBACK_TYPE=${1:-"schema"}
BACKUP_DATE=${2:-$(date +%Y%m%d)}

echo "🚨 EMERGENCY ROLLBACK INITIATED"
echo "Type: $ROLLBACK_TYPE"
echo "Backup Date: $BACKUP_DATE"

case $ROLLBACK_TYPE in
    "schema")
        echo "Executing Schema-Only Rollback..."
        ./scripts/schema_rollback.sh $BACKUP_DATE
        ;;
    "partial")
        echo "Executing Partial Data Rollback..."
        ./scripts/partial_rollback.sh $BACKUP_DATE
        ;;
    "full")
        echo "Executing Complete Database Restore..."
        ./scripts/full_restore.sh $BACKUP_DATE
        ;;
    *)
        echo "Invalid rollback type. Use: schema|partial|full"
        exit 1
        ;;
esac

echo "✅ Rollback completed. Begin validation procedures."
```

### Validation Script
```bash
#!/bin/bash
# rollback_validation.sh

echo "🔍 ROLLBACK VALIDATION STARTING"

# Data counts
echo "Checking data integrity..."
supabase db remote --project-ref $SUPABASE_PROJECT_REF psql -c "
SELECT 'objects' as table_name, count(*) FROM objects 
UNION ALL SELECT 'media', count(*) FROM media 
UNION ALL SELECT 'accounts', count(*) FROM accounts;"

# Foreign keys
echo "Validating foreign key constraints..."
supabase db remote --project-ref $SUPABASE_PROJECT_REF psql -c "
SELECT count(*) as fk_constraints FROM pg_constraint WHERE contype = 'f';"

# Application health
echo "Testing application endpoints..."
curl -f https://your-app.com/api/health || echo "❌ Health check failed"
curl -f https://your-app.com/api/objects?limit=1 || echo "❌ Objects API failed"

echo "✅ ROLLBACK VALIDATION COMPLETED"
```

This emergency rollback plan provides multiple options depending on the severity of issues encountered, with clear decision criteria and comprehensive validation procedures to ensure system recovery.