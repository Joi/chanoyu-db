# Production Auth and Member Data Protection Plan

## Overview

This document outlines the critical protection strategies for production user authentication and member data during the database migration consolidation process.

## Auth Schema Analysis

### Supabase Auth Tables (DO NOT MODIFY)
- `auth.users` - Core user identities and authentication data
- `auth.sessions` - Active user sessions
- `auth.refresh_tokens` - JWT refresh tokens
- `auth.identities` - OAuth provider identities
- `auth.audit_log_entries` - Authentication audit trail
- `auth.mfa_factors` - Multi-factor authentication data
- `auth.one_time_tokens` - Password reset and verification tokens

### Application Tables (MIGRATION TARGET)
- `public.accounts` - Application-level user profiles
- `public.tea_schools` - Tea school affiliations
- `public.chakai_attendees` - Event participation records

## Data Protection Strategies

### 1. Auth Data Isolation
**CRITICAL**: The consolidated migration only affects the `public` schema. All Supabase `auth` schema tables remain completely untouched.

- ✅ Auth tables are managed by Supabase infrastructure
- ✅ Migration only consolidates `public` schema application tables
- ✅ No risk of auth data corruption during schema consolidation

### 2. Production Member Data Preservation

#### Current Local vs Production Data
```sql
-- Local database (test data)
SELECT count(*) FROM accounts; -- 5 test accounts

-- Production database (real members)
-- Expected: Real tea ceremony practitioners and collectors
```

#### Protection Strategy
1. **Pre-migration Auth Backup**: Export all auth-related data before any changes
2. **Application Data Sync**: Carefully sync only non-auth application data
3. **Identity Preservation**: Maintain all auth.users -> public.accounts relationships

### 3. Data Transfer Rules

#### NEVER Transfer (Production -> Local):
- `auth.*` tables (authentication data)
- Production user passwords or tokens
- Real member personal information
- Production-only access credentials

#### Safe to Transfer (Local -> Production):
- Tea ceremony objects and classifications
- Media files and metadata
- Location data
- Tea school reference data (non-personal)

#### Bidirectional Sync Required:
- `public.accounts` profiles (sync with auth.users)
- Member tea school affiliations
- Event participation records

## Implementation Checklist

### Pre-Migration Verification
- [ ] Confirm all auth data exists only in `auth` schema
- [ ] Verify no application code directly modifies `auth` tables
- [ ] Document all auth.users -> public.accounts relationships
- [ ] Backup production auth data independently

### Migration Execution
- [ ] Apply schema changes only to `public` schema
- [ ] Preserve all foreign key relationships to auth.users
- [ ] Maintain RLS policies that reference auth data
- [ ] Test authentication flow post-migration

### Post-Migration Validation
- [ ] Verify all users can still authenticate
- [ ] Confirm auth.users -> public.accounts links intact
- [ ] Test member permissions and access levels
- [ ] Validate tea school affiliations preserved

## Risk Mitigation

### High Priority Risks
1. **Auth Data Corruption**: Mitigated by schema isolation
2. **Member Profile Loss**: Prevented by careful accounts table handling
3. **Permission System Failure**: Protected by RLS policy preservation

### Contingency Plans
1. **Auth Backup Restoration**: Independent auth schema backup
2. **Account Re-linking**: Procedures to reconnect auth.users to public.accounts
3. **Permission Reset**: Emergency admin access procedures

## Production Environment Considerations

### Supabase-Specific Protections
- Auth tables managed by Supabase infrastructure
- Built-in backup and recovery for auth data
- Schema-level isolation protects auth from application changes

### Application-Level Safeguards
- RLS policies continue to reference auth context
- No breaking changes to authentication flow
- Member data remains linked to auth identities

## Conclusion

The production auth and member data protection is built on **schema isolation** - the migration only affects `public` schema tables while leaving all `auth` schema data completely untouched. This architectural separation provides natural protection for user authentication data during the consolidation process.