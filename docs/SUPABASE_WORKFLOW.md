# Supabase Development Workflow

## Overview

This document outlines the complete development workflow for working with Supabase locally using Docker, developing on branches, testing migrations, and safely deploying to production.

## Environment Setup

### Local Development Environment

- **Local Docker Supabase**: All development happens against local Supabase instance
- **Configuration**: Uses `.env.local.dev` for local development
- **Database**: `LOCAL_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- **API**: `http://127.0.0.1:54321`
- **Studio**: `http://127.0.0.1:54323`

### Production Environment

- **Configuration**: Uses `.env.local` for production
- **Remote Supabase**: Production database at `ropxawmhtemygmrojlhu.supabase.co`

## Development Workflow

### 1. Initial Setup

```bash
# Ensure Supabase local environment is running
supabase status

# If not running, start it
supabase start

# Verify Docker containers are healthy
docker ps
```

### 2. Branch-Based Development

Always create descriptive feature branches directly from `main`, connected to GitHub issues:

```bash
# Start from main branch
git checkout main
git pull origin main

# Create descriptive feature branch (e.g., connected to issue #123)
git checkout -b feature/tea-school-tracking-123

# Switch to local development environment
# Use .env.local.dev (automatically used for local development)
```

### 3. Database Schema Changes

**CRITICAL**: Always work with local Docker Postgres for all SQL operations.

#### Creating Migrations

```bash
# Ensure local Supabase is running
supabase status

# Create new migration
supabase db diff --file migration_name

# Or create empty migration
supabase migration new migration_name
```

#### Testing Migrations Locally

```bash
# Apply migration to local database
supabase db reset

# Verify migration applied correctly
supabase db diff

# Test your application locally
pnpm dev
```

#### Migration Development Process

1. **Make schema changes** using Supabase Studio at `http://127.0.0.1:54323`
2. **Generate migration** with `supabase db diff --file migration_name`
3. **Reset and test** with `supabase db reset`
4. **Verify application** works with `pnpm dev`
5. **Commit migration** to feature branch

### 4. Testing and Validation

Before pushing to remote:

```bash
# Type checking
pnpm typecheck

# Run tests (if available)
pnpm test

# Build application
pnpm build

# Test locally one more time
pnpm dev
```

### 5. Remote Database Operations

**⚠️ IMPORTANT**: Never touch production database directly during development.

#### Backup Before Deployment

```bash
# Create backup of remote database before applying migrations
supabase db dump --remote > backup_$(date +%Y%m%d_%H%M%S).sql

# Store backup safely
mkdir -p backups
mv backup_*.sql backups/
```

#### Apply Migrations to Remote

Only do this after thorough local testing:

```bash
# Push migrations to remote (staging first if available)
supabase db push --remote

# Verify migration applied correctly
supabase db diff --remote
```

### 6. Branch Integration and Deployment

```bash
# Push feature branch
git add -A
git commit -m "feat: add tea school tracking (closes #123)"
git push origin feature/tea-school-tracking-123

# Create PR directly to main branch
gh pr create --base main --head feature/tea-school-tracking-123 \
  --title "feat: add tea school tracking" \
  --body "Implements tea school tracking functionality. Closes #123."

# Test on preview environment using the feature branch preview URL
# Vercel automatically creates preview deployments for all branches

# After PR approved and merged to main
git checkout main
git pull origin main

# Production automatically deploys via Vercel
```

## Database Management Commands

### Local Development

```bash
# Check status
supabase status

# Start local environment
supabase start

# Stop local environment
supabase stop

# Reset local database (applies all migrations)
supabase db reset

# Create new migration
supabase migration new migration_name

# Generate migration from schema changes
supabase db diff --file migration_name

# Connect to local database
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Remote Operations

```bash
# Connect to remote database (use with caution)
supabase db link --project-ref ropxawmhtemygmrojlhu

# Backup remote database
supabase db dump --remote > backup.sql

# Push migrations to remote
supabase db push --remote

# Check remote schema differences
supabase db diff --remote
```

## Environment Variables

### Local Development (`.env.local.dev`)

```bash
# Supabase local development (automatically used)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
LOCAL_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Production (`.env.local`)

```bash
# Supabase production
NEXT_PUBLIC_SUPABASE_URL=https://ropxawmhtemygmrojlhu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[production-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[production-service-role-key]
```

## Best Practices

### DO ✅

- Always start `supabase status` before development
- Test all migrations locally with `supabase db reset`
- Create database backups before remote deployments
- Use feature branches for all database changes
- Test application thoroughly after migrations
- Use `LOCAL_DATABASE_URL` for all SQL operations during development
- Verify schema consistency between local and production before releases
- Remove unused columns/fields from application code if they don't exist in production

### DON'T ❌

- Never touch production database directly during development
- Don't skip local testing of migrations
- Don't apply untested migrations to remote database
- Don't commit secrets or production credentials
- Don't use remote database for development or testing
- Don't reference database columns in application code without verifying they exist in production

## Troubleshooting

### Local Environment Issues

```bash
# If Supabase containers are not running
supabase stop
supabase start

# If containers are corrupted
docker system prune
supabase start

# If migrations fail locally
supabase db reset --debug
```

### Migration Issues

```bash
# Check migration status
supabase migration list

# Repair migrations
supabase migration repair <timestamp>

# Force reset if needed
supabase db reset --force
```

### Remote Connection Issues

```bash
# Re-link project
supabase db link --project-ref ropxawmhtemygmrojlhu

# Check connection
supabase projects list
```

### Schema Drift Issues

If you encounter errors like "column does not exist" in production:

```bash
# Check schema differences between local and remote
supabase db diff --remote

# Identify missing columns or tables
# Remove references to non-existent columns from application code
# OR create migration to add missing columns to production

# Example: Remove unused column references
# Instead of: SELECT id, title, tags FROM objects
# Use: SELECT id, title FROM objects

# Apply missing migrations to production (with caution)
supabase db push --remote
```

**Common causes of schema drift:**
- Local development schema includes columns not in production
- Migrations created locally but not applied to production
- Manual schema changes in local development without migrations

## CLI Commands Reference

| Command | Description |
|---------|-------------|
| `supabase status` | Check local environment status |
| `supabase start` | Start local Supabase environment |
| `supabase stop` | Stop local environment |
| `supabase db reset` | Reset local DB and apply migrations |
| `supabase db diff --file name` | Generate migration from changes |
| `supabase migration new name` | Create empty migration |
| `supabase db push --remote` | Apply migrations to remote |
| `supabase db dump --remote > file.sql` | Backup remote database |

This workflow ensures safe, tested database changes while maintaining separation between local development and production environments.