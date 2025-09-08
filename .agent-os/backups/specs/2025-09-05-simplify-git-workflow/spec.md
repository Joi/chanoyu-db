# Spec Requirements Document

> Spec: Simplify Git Workflow (Remove Dev Branch Intermediary)
> Created: 2025-09-05
> Status: Planning

## Overview

Simplify the current Git workflow by removing the dev branch as an intermediary step between feature branches and main. This change will streamline the development process by allowing direct PRs from feature branches to main, while maintaining proper CI/CD practices and preview deployments.

Currently, the workflow requires: feature branch → dev → main
The new workflow will be: feature branch → main

This change will reduce complexity, eliminate unnecessary merge steps, and create a cleaner deployment pipeline while preserving all quality gates and testing requirements.

## User Stories

**As a developer**, I want to create PRs directly from my feature branch to main so that I can reduce the number of merge steps and potential conflicts.

**As a developer**, I want my feature branches to automatically deploy to preview environments so that I can test changes before merging to main.

**As a project maintainer**, I want a simplified branching strategy that reduces overhead while maintaining code quality and deployment safety.

**As a CI/CD system**, I want clear triggers for when to build previews vs production deployments so that resources are used efficiently.

## Spec Scope

- **CI/CD Updates**: Modify GitHub Actions workflows (ci.yml, vercel-preview.yml) to work with the new branching strategy
- **Documentation Updates**: Update CLAUDE.md, README.md, and any other files that reference the old dev → main workflow
- **Vercel Configuration**: Ensure preview deployments work correctly for feature branches targeting main
- **Git Hooks Cleanup**: Review and update any git hooks (.husky) that reference the dev branch
- **Agent-OS Instruction Updates**: Update project instructions to reflect the new workflow in all relevant documentation
- **Branch Protection Rules**: Document recommended GitHub branch protection settings for main branch

## Out of Scope

- Changing fundamental deployment architecture or Vercel project configuration
- Modifying current main branch protection rules (will be documented as recommendations)
- Altering the shared database setup between environments
- Creating new deployment environments beyond the current preview/production setup

## Expected Deliverable

A complete workflow transition that enables:

1. **Direct Feature Branch PRs**: Developers can create PRs from feature branches directly to main
2. **Automatic Preview Deployments**: Feature branch pushes trigger Vercel preview deployments
3. **Production Deployments**: Main branch pushes trigger production deployments to collection.ito.com
4. **Updated Documentation**: All project documentation reflects the new simplified workflow
5. **Clean CI/CD Pipeline**: GitHub Actions workflows optimized for the new branching strategy

## Spec Documentation

- Tasks: @.agent-os/specs/2025-09-05-simplify-git-workflow/tasks.md
- Technical Specification: @.agent-os/specs/2025-09-05-simplify-git-workflow/sub-specs/technical-spec.md