# Contributing to Chanoyu-DB

Welcome! This guide will help you get started contributing to the project.

## Getting Started

### 1. Environment Setup

```bash
# Clone the repo
git clone [repo-url]
cd chanoyu-db

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Get actual values from project owner
```

### 2. Branch Strategy

- `main` - Production (don't commit directly)
- `dev` - Development/Preview (main work branch)
- Feature branches optional for large changes

### 3. Daily Workflow

```bash
# Start on dev branch
git checkout dev
git pull origin dev

# Make your changes
npm run dev  # Start local server

# Test your changes
npm run typecheck  # Check types
npm run lint       # Check code style

# Commit and push
git add .
git commit -m "feat: description of change"
git push origin dev

# Check preview at dev.collection.ito.com
```

### 4. Making a PR to Production

1. Test thoroughly on dev.collection.ito.com
2. Create PR from `dev` to `main` on GitHub
3. Add description of changes
4. Wait for review/approval
5. Merge when approved

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
- [ ] Tested on dev branch
- [ ] Checked mobile responsiveness
- [ ] Verified database queries work
- [ ] Images load correctly

Welcome aboard! 🍵
