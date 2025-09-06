# Contributing to Chanoyu-DB

Welcome! This guide will help you get started contributing to the project.

## Getting Started

### 1. Environment Setup

```bash
# Clone the repo
git clone [repo-url]
cd chanoyu-db

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Get actual values from project owner
```

### 2. Branch Strategy

- `main` - Production (don't commit directly)
- Descriptive feature branches from `main` for all changes
- Branch naming: `feature/descriptive-name-123` (where 123 is issue number)
- No persistent dev branch

### 3. Daily Workflow

```bash
# Start from main branch and create feature branch
git checkout main
git pull origin main
git checkout -b feature/your-feature-name-123

# Ensure local Docker Supabase is running
supabase status

# Make your changes
pnpm dev  # Start local server

# Test your changes
pnpm typecheck  # Check types
pnpm lint       # Check code style

# Commit and push
git add .
git commit -m "feat: description of change (closes #123)"
git push origin feature/your-feature-name-123

# Check Vercel's automatic preview deployment for your branch
```

### 4. Making a PR to Production

1. Test thoroughly on your branch's Vercel preview URL
2. Create PR from feature branch to `main` on GitHub using:
   ```bash
   gh pr create --base main --head feature/your-feature-name-123
   ```
3. Add description of changes and link to issues (e.g., "Closes #123")
4. Wait for review/approval
5. Merge when approved (feature branch will be auto-deleted)

## Monorepo boundaries and PR guidance

This repository intentionally hosts two stacks that share a single Supabase schema:

- Web app (Next.js + TS): `app/`, `lib/`, `components/`, `scripts/` (TS utilities)
- Ingestion (Python): `ingestion/` plus Python support files (`requirements*.txt`, `src/`, `tests/`)
- Database contract: `supabase/` (migrations, policies, seeds)

Guidelines:
- Keep cross-cutting changes small and atomic. If a schema change affects both ingestion and web, put all required edits in one PR.
- Secrets live in environment files appropriate to each stack. Do not mix client `.env.local` with ingestion `.env`.
- Prefer server components for data fetching; follow Supabase access patterns under `lib/supabase/`.
- CI should run jobs based on path changes; see `docs/CI_MONOREPO.md`.

## Working with AI Assistants

We use Claude and Cursor for development. See `CLAUDE.md` for guidelines.

### Quick Tips:
- Give AI specific file paths
- Keep tasks small and focused
- Test AI-generated code locally first
- Review database queries carefully

## Code Style

### TypeScript/React
- Use TypeScript strictly (no `any` types)
- Prefer async/await over promises
- Use existing components when possible

### Database
- Always use RLS policies
- Test queries in Supabase dashboard first
- Keep visibility rules consistent

### Commits
- Use conventional commits:
  - `feat:` new feature
  - `fix:` bug fix
  - `docs:` documentation
  - `style:` formatting
  - `refactor:` code restructuring
  - `test:` adding tests
  - `chore:` maintenance

## Common Tasks

### Adding a New Object Field
1. Update Supabase schema
2. Update TypeScript types in `/lib/types`
3. Update relevant components
4. Test data flow end-to-end

### Working with Images
- Use Supabase Storage
- Convert HEIC to JPEG
- Keep under 5MB when possible
- Test with `/scripts/ingest-notion.ts`

### Adding a New Page
1. Create in `/app/[name]/page.tsx`
2. Follow existing page patterns
3. Add to navigation if needed
4. Test on mobile and desktop

## Getting Help

- Check `TASKS.md` for current priorities
- Ask in GitHub issues for clarification
- Use `docs/WORKFLOW.md` for deployment questions
- Reference `README.md` for architecture

## Testing Checklist

Before pushing:
- [ ] Code runs locally without errors
- [ ] TypeScript has no errors
- [ ] Tested on feature branch preview
- [ ] Checked mobile responsiveness
- [ ] Verified database queries work
- [ ] Images load correctly

Welcome aboard! 🍵
