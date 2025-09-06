# Comprehensive Backup Strategy for Production Migration

## Overview

This document outlines the complete backup and data preservation strategy for the production database migration consolidation.

## Backup Components

### 1. Supabase CLI Database Dump

#### Complete Database Backup
```bash
# Full database dump (schema + data)
supabase db dump --project-ref [PROJECT_REF] > production_full_backup_$(date +%Y%m%d_%H%M%S).sql

# Schema-only backup
supabase db dump --project-ref [PROJECT_REF] --schema-only > production_schema_backup_$(date +%Y%m%d_%H%M%S).sql

# Data-only backup
supabase db dump --project-ref [PROJECT_REF] --data-only > production_data_backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Specific Schema Backups
```bash
# Public schema only (migration target)
supabase db dump --project-ref [PROJECT_REF] --schema public > production_public_schema_$(date +%Y%m%d_%H%M%S).sql

# Auth schema preservation (reference only - managed by Supabase)
supabase db dump --project-ref [PROJECT_REF] --schema auth > production_auth_reference_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Critical Data Exports

#### Application Tables (High Priority)
```bash
# Core business data
supabase db dump --project-ref [PROJECT_REF] --table public.objects > backup_objects_$(date +%Y%m%d_%H%M%S).sql
supabase db dump --project-ref [PROJECT_REF] --table public.media > backup_media_$(date +%Y%m%d_%H%M%S).sql
supabase db dump --project-ref [PROJECT_REF] --table public.accounts > backup_accounts_$(date +%Y%m%d_%H%M%S).sql
supabase db dump --project-ref [PROJECT_REF] --table public.local_classes > backup_local_classes_$(date +%Y%m%d_%H%M%S).sql
supabase db dump --project-ref [PROJECT_REF] --table public.chakai > backup_chakai_$(date +%Y%m%d_%H%M%S).sql
```

#### Reference Data
```bash
# Classification and reference data
supabase db dump --project-ref [PROJECT_REF] --table public.classifications > backup_classifications_$(date +%Y%m%d_%H%M%S).sql
supabase db dump --project-ref [PROJECT_REF] --table public.tea_schools > backup_tea_schools_$(date +%Y%m%d_%H%M%S).sql
supabase db dump --project-ref [PROJECT_REF] --table public.locations > backup_locations_$(date +%Y%m%d_%H%M%S).sql
```

### 3. Supabase Storage Backup

#### Media Files and Assets
```bash
# Create storage backup manifest
supabase storage ls --project-ref [PROJECT_REF] > storage_manifest_$(date +%Y%m%d_%H%M%S).txt

# Note: Individual file backup requires custom script
# Supabase CLI doesn't have bulk storage download yet
```

### 4. Configuration and Metadata Backup

#### Database Configuration
```bash
# RLS policies
supabase db dump --project-ref [PROJECT_REF] --include-policies > production_policies_backup_$(date +%Y%m%d_%H%M%S).sql

# Functions and triggers
supabase db dump --project-ref [PROJECT_REF] --include-functions > production_functions_backup_$(date +%Y%m%d_%H%M%S).sql
```

## Backup Procedures

### Pre-Migration Backup Checklist

#### 1. Environment Preparation
```bash
# Ensure Supabase CLI is authenticated
supabase login

# Verify project access
supabase projects list

# Set project reference
export SUPABASE_PROJECT_REF="your-project-ref-here"
```

#### 2. Execute Complete Backup
```bash
#!/bin/bash
# production_backup.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/production_migration_${TIMESTAMP}"
mkdir -p $BACKUP_DIR

echo "Starting production database backup at $(date)"

# Complete database backup
supabase db dump --project-ref $SUPABASE_PROJECT_REF > "${BACKUP_DIR}/full_database_backup.sql"

# Schema and data separation
supabase db dump --project-ref $SUPABASE_PROJECT_REF --schema-only > "${BACKUP_DIR}/schema_only_backup.sql"
supabase db dump --project-ref $SUPABASE_PROJECT_REF --data-only > "${BACKUP_DIR}/data_only_backup.sql"

# Public schema specific
supabase db dump --project-ref $SUPABASE_PROJECT_REF --schema public > "${BACKUP_DIR}/public_schema_backup.sql"

# Critical table backups
for table in objects media accounts local_classes chakai classifications tea_schools locations; do
    supabase db dump --project-ref $SUPABASE_PROJECT_REF --table public.$table > "${BACKUP_DIR}/table_${table}_backup.sql"
done

# Create backup verification
echo "Backup completed at $(date)" > "${BACKUP_DIR}/backup_info.txt"
ls -la "${BACKUP_DIR}" >> "${BACKUP_DIR}/backup_info.txt"

echo "Production backup completed: ${BACKUP_DIR}"
```

#### 3. Backup Verification
```bash
# Verify backup file integrity
for file in ${BACKUP_DIR}/*.sql; do
    if [ -s "$file" ]; then
        echo "✅ $file - OK ($(wc -l < "$file") lines)"
    else
        echo "❌ $file - EMPTY OR MISSING"
    fi
done

# Test restore on local environment (optional)
psql "postgresql://postgres:postgres@127.0.0.1:54322/test_restore" < "${BACKUP_DIR}/full_database_backup.sql"
```

## Backup Retention and Security

### Storage Strategy
- **Local Storage**: Keep backups on secure local development machine
- **Cloud Storage**: Upload to encrypted cloud storage (AWS S3, Google Cloud)
- **Version Control**: Store backup scripts in project repository
- **Documentation**: Maintain backup manifest with timestamps and file sizes

### Retention Policy
- **Immediate**: Keep all migration-related backups indefinitely
- **Pre-migration**: Minimum 30 days retention
- **Post-migration**: Keep successful migration backups for 90 days
- **Archive**: Long-term storage of critical milestone backups

### Security Considerations
- Encrypt backups containing production data
- Restrict access to backup files
- Use secure transfer methods (SFTP, encrypted cloud storage)
- Regular backup integrity verification

## Restoration Procedures

### Emergency Restoration
```bash
# Full database restore (DESTRUCTIVE - use with caution)
psql $DATABASE_URL < full_database_backup.sql

# Selective table restore
psql $DATABASE_URL < table_objects_backup.sql
```

### Partial Restoration
```bash
# Schema-only restore (for structure recovery)
psql $DATABASE_URL < schema_only_backup.sql

# Data-only restore (after schema is correct)
psql $DATABASE_URL < data_only_backup.sql
```

## Testing and Validation

### Backup Testing Protocol
1. **Monthly Backup Tests**: Restore backups to staging environment
2. **Pre-Migration Dry Run**: Complete backup/restore cycle on test instance
3. **Integrity Verification**: Checksum validation and row count verification
4. **Performance Testing**: Measure backup and restore times

### Success Criteria
- All backup files generated without errors
- Backup files contain expected data volumes
- Test restoration completes successfully
- All critical data preserved and accessible

## Production Migration Day Backup

### Timeline
- **T-60 minutes**: Begin comprehensive backup process
- **T-30 minutes**: Verify backup completion and integrity
- **T-15 minutes**: Final incremental backup
- **T-0**: Begin migration with fresh backup available

### Go/No-Go Criteria
- ✅ All backup files generated successfully
- ✅ Backup integrity verified
- ✅ Restore procedures tested and validated
- ✅ Emergency rollback plan confirmed ready
- ✅ Team communication channels established

This comprehensive backup strategy ensures complete data protection throughout the migration process with multiple recovery options and thorough validation procedures.