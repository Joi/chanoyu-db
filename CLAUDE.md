# Claude/AI Assistant Guidelines

## Quick Context

This is a Next.js + Supabase app for managing tea ceremony (chanoyu) collections. The main developer uses Cursor and Claude for development assistance.

## Key Information for AI

### Project Structure
- **Frontend**: Next.js App Router with TypeScript
- **Database**: Supabase (Postgres with RLS)
- **Local Development**: Docker-based Supabase (Postgres 17.4, full stack)
- **Deployment**: Vercel (feature branches → preview, main → production)
- **Storage**: Supabase Storage for images

### Important Files
- `/app` - Next.js app router pages
- `/lib` - Shared utilities and Supabase client
- `/scripts` - Data ingestion scripts (Notion, Google Sheets)
- `/supabase` - Database migrations and types
- `/docs/SUPABASE_WORKFLOW.md` - Complete Supabase development workflow

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL 17.4 via Supabase
- **Local Development**: Docker (Supabase CLI)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Deployment**: Vercel
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm

### Current Focus Areas
1. Object management (tea utensils)
2. Chakai (tea gathering) events
3. Image handling and storage
4. Bilingual support (EN/JA)

## Working with Claude/Cursor

### For Simple Tasks
```
"Update the chakai list page to show event dates in a more readable format"
- Point to: /app/chakai/page.tsx
- Context: We use date-fns for formatting
```

### For Complex Tasks
```
"I need to add a new feature for tracking tea schools"
1. First ask Claude to review existing patterns in /app
2. Have it suggest database schema changes
3. Implement in steps: database → API → UI

### Planning & Tasks (Updated)

- Use GitHub Issues as the source of truth (no local markdown task lists).
- Create descriptive feature branches directly from `main`, connected to GitHub issues.
- Branch naming: `feature/descriptive-name-123` (where 123 is the issue number).
- Open PR directly to `main` (no persistent dev branch).
- Specs live under `.agent-os/specs/YYYY-MM-DD-slug/` and are linked from the initial Spec issue.
- Prefer the `gh` CLI or GitHub UI to create issues with labels like `type:*`, `area:*`, `priority:*`, `state:*`, and `feature:<slug>`.
```

### Database Changes
**IMPORTANT: Always work with LOCAL Docker Postgres only for SQL operations**
- Use connection string from `.env.local.dev`: `LOCAL_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- Never touch remote/production database directly
- Always use `supabase status` to ensure local environment is running
- Create migrations in `/supabase/migrations/` for deployment
- See `/docs/SUPABASE_WORKFLOW.md` for complete workflow

**Development Workflow:**
1. Create descriptive feature branch from `main` (connected to GitHub issue)
2. Test migrations locally with `supabase db reset`
3. Backup remote database before deployment
4. Apply migrations to remote after local testing
5. Direct PR workflow: feature → main

Always provide:
1. Current schema (from local database)
2. RLS policies that need updating  
3. Whether this affects public visibility

### Testing Approach
- Local first: `pnpm dev`
- Check types: `pnpm typecheck`
- Deploy to preview: `git push origin feature/descriptive-name-123`
- Test on Vercel preview URL (automatically generated for all branches)
- Direct PR to main after testing

## Common Patterns

### Adding a New Page
1. Create file in `/app/[feature]/page.tsx`
2. Use existing components from `/app/components`
3. Follow the pattern in `/app/chakai/page.tsx`

### API Routes
- Location: `/app/api/[endpoint]/route.ts`
- Use service role for admin operations
- Check user session for protected routes

### Supabase Queries
```typescript
// Public data
const { data } = await supabase
  .from('objects')
  .select('*')
  .eq('visibility', 'public')

// Admin data (use service role client)
const { data } = await supabaseAdmin
  .from('objects')
  .select('*')
```

## Do's and Don'ts

### DO:
- Keep changes focused and testable
- Update types when changing database schema
- Test image uploads with small files first
- Use existing UI components when possible

### DON'T:
- Make large refactors without discussion
- Change production database directly
- Commit .env files
- Skip TypeScript checks

## Getting Help

If Claude gets confused or runs out of context:
1. Start a new conversation
2. Reference this file
3. Point to specific files needed
4. Keep the task scope small
