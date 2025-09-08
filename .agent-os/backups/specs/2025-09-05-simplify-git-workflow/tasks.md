# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-09-05-simplify-git-workflow/spec.md

> Created: 2025-09-05
> Status: Ready for Implementation

## Tasks

### Phase 1: CI/CD Workflow Updates

- [ ] **Update GitHub Actions CI workflow**
  - File: `.github/workflows/ci.yml`
  - Change trigger from `dev` branch to `main` branch for PRs
  - Ensure type checking and build validation runs on feature branches
  - Test workflow with a sample feature branch

- [ ] **Update Vercel preview workflow**
  - File: `.github/workflows/vercel-preview.yml`
  - Configure to trigger on feature branch pushes (not dev)
  - Verify preview deployments work for PRs targeting main
  - Test preview URL generation and PR commenting

- [ ] **Verify Vercel platform configuration**
  - Confirm production branch is set to `main`
  - Ensure preview branch strategy covers all non-main branches
  - Test automatic deployment triggers

### Phase 2: Documentation Updates

- [ ] **Update CLAUDE.md project instructions**
  - Remove all references to dev branch in workflow documentation
  - Change "Create a feature branch from `dev`" to "Create a feature branch from `main`"
  - Update "Deploy to preview: `git push origin dev`" section
  - Update preview URL reference from "dev.collection.ito.com" to feature branch previews
  - Update "open a PR to `dev`" to "open a PR to `main`"

- [ ] **Review and update README.md**
  - Update any branching strategy documentation if present
  - Revise contribution guidelines to reflect new workflow
  - Ensure consistency with CLAUDE.md updates

- [ ] **Update agent-os instruction files**
  - Review all `.agent-os/` files for dev branch references
  - Ensure AI assistant instructions reflect new workflow
  - Update any workflow examples or templates

### Phase 3: Git Hooks and Local Setup

- [ ] **Review Husky git hooks**
  - Check `.husky/` directory for any dev branch specific hooks
  - Update or remove hooks that reference dev branch workflow
  - Ensure pre-commit and pre-push hooks work with new workflow

- [ ] **Clean up branch references**
  - Search codebase for hardcoded "dev" branch references
  - Update any scripts or configuration that assumes dev branch existence
  - Document any remaining dev branch dependencies

### Phase 4: Testing and Validation

- [ ] **Create test feature branch**
  - Branch from main instead of dev
  - Make a small test change
  - Verify CI/CD pipeline works correctly
  - Test preview deployment generation

- [ ] **Validate GitHub Issues workflow**
  - Create a test issue with `feature:<slug>` label
  - Link to spec from issue
  - Verify GitHub Issues remain the source of truth for tasks
  - Test that feature branches can be linked to issues properly

- [ ] **End-to-end workflow test**
  - Complete feature branch → main PR process
  - Verify all quality gates and checks pass
  - Confirm production deployment works after merge to main
  - Document any issues or edge cases discovered

### Phase 5: Documentation and Communication

- [ ] **Update project README or wiki**
  - Document the new simplified workflow
  - Provide examples of the new PR process
  - Include troubleshooting guide if needed

- [ ] **Create workflow transition guide**
  - Document what changed and why
  - Provide migration steps for developers
  - Include rollback plan if needed

### Notes

- **Database Consideration**: Remember that all environments share the same Supabase database, so database changes affect all environments regardless of branch
- **Issue Tracking**: Continue using GitHub Issues as the source of truth for project management, not local markdown files
- **Preview Testing**: Feature branch previews will be the new way to test changes before merging to main