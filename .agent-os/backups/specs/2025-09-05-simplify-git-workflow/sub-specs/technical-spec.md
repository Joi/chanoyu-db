# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-09-05-simplify-git-workflow/spec.md

> Created: 2025-09-05
> Version: 1.0.0

## Technical Requirements

### CI/CD Workflow Updates

**File: `.github/workflows/ci.yml`**
- Update trigger conditions to handle PRs targeting main instead of dev
- Ensure type checking and build verification runs on feature branches
- Maintain existing quality gates (lint, type check, build validation)

**File: `.github/workflows/vercel-preview.yml`**
- Configure to trigger on pushes to feature branches (not dev)
- Ensure preview deployments work for PRs targeting main
- Verify preview URL generation and commenting on PRs

### Vercel Configuration

**Platform Settings:**
- Production branch: main (no change)
- Preview branch strategy: All branches except main should trigger previews
- Ensure automatic deployments work correctly with new workflow

### Documentation Updates

**File: `/CLAUDE.md`**
- Update "Planning & Tasks" section to remove references to dev branch
- Change workflow documentation from "feature branch → dev → main" to "feature branch → main"
- Update deployment testing instructions (remove "deploy to preview: git push origin dev")
- Update preview URL from "dev.collection.ito.com" to feature branch previews

**File: `/README.md` (if exists)**
- Update any branching strategy documentation
- Revise contribution guidelines to reflect new workflow

**File: `.agent-os/` instruction files**
- Update any agent-os files that reference the old workflow
- Ensure consistent messaging about the new branching strategy

### Git Hooks and Local Development

**Directory: `.husky/`**
- Review pre-commit and pre-push hooks for any dev branch references
- Update or remove any hooks that specifically target dev branch workflows
- Ensure hooks work correctly with feature branches targeting main

## Approach

### Phase 1: Workflow Configuration
1. Update GitHub Actions workflows to handle the new branch targeting
2. Test CI/CD pipeline with a test feature branch
3. Verify Vercel preview deployments work correctly

### Phase 2: Documentation Cleanup
1. Update all documentation files that reference the old workflow
2. Ensure consistent messaging across all project documentation
3. Update agent-os instructions for AI assistants

### Phase 3: Validation and Testing
1. Create test PRs using the new workflow
2. Verify preview deployments work as expected
3. Confirm production deployments still work correctly
4. Test that all quality gates and checks still function

### Database Considerations

**Important Note:** The application uses a single shared Supabase database across all environments (local, preview, production). This workflow change does not affect the database setup, but developers should continue to be mindful that database changes affect all environments.

**No schema changes required** - this is purely a workflow and CI/CD configuration change.

## External Dependencies

### GitHub Actions
- Existing workflows need updates but no new dependencies
- Branch protection rules may need adjustment (documentation only)

### Vercel
- Preview deployment configuration needs verification
- No new integrations required

### Supabase
- No changes required to database or authentication setup
- Existing service role and anon key configurations remain unchanged

### Development Tools
- Husky git hooks may need minor updates
- No new tool dependencies introduced