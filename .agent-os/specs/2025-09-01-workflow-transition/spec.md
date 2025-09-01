# Spec Requirements Document

> Spec: Workflow Transition to Feature Branches, Specs, and GitHub Issues
> Created: 2025-09-01

## Overview

Transition the project from a single `dev` working branch and local markdown task lists to a feature-branch workflow with per-feature spec directories and GitHub Issues for planning and execution. Keep automation simple using GitHub CLI, labels, and milestones.

## User Stories

### As a maintainer, I can create a new feature branch with a spec and issues

As a maintainer, I want a predictable way to spin up a feature branch, write a spec in a dedicated subdirectory, and create labeled GitHub issues so that planning and execution are visible and reviewable.

Detailed workflow: run a bootstrap command with a short name; it creates a branch from `dev`, a spec folder under `.agent-os/specs/YYYY-MM-DD-slug/`, an initial “Spec” issue, and a draft PR targeting `dev`.

### As a contributor, I can pick up work from labeled issues

As a contributor, I want issues to be the source of truth with clear labels (type, area, priority, spec/feature) so I can filter and work without consulting local markdown task files.

Detailed workflow: filter by `feature:<slug>` or milestone, pick an issue labeled `ready`, link my branch/PR, and close via “Fixes #123”.

## Spec Scope

1. Feature branch workflow: branch per feature from `dev`; PR → `dev`; `dev` → `main` via PR.
2. Spec directories: continue using `.agent-os/specs/YYYY-MM-DD-slug/` for specs.
3. GitHub Issues as tasks: replace `TASKS.md` and any `tasks.md` with Issues.
4. Labels and milestones: introduce simple label taxonomy and optional per-feature milestones.
5. Minimal automation: add `scripts/feature-bootstrap.sh` using `gh` to create branch, spec stub, initial issue, draft PR.

## Out of Scope

- Full GitHub Projects/boards automation.
- Complex sync between spec checklists and issues.
- Changing database branching guidance (see existing `docs/SUPABASE_BRANCHING.md`).

## Expected Deliverable

1. Updated docs and agent instructions referencing Issues instead of local task lists.
2. New labels guidance and a simple bootstrap script to create branch/issue/PR.

## Implementation Notes

- Labels (initial set):
  - type:feature, type:bug, type:chore, type:docs
  - area:frontend, area:api, area:db, area:admin, area:media, area:workflow, area:docs
  - priority:P0, priority:P1, priority:P2
  - state:ready, state:blocked, state:needs-spec
  - feature:`your-slug` (e.g., feature:workflow-transition)
- Milestones: optional "Feature: Short Name" to group issues per feature.
- PRs: target `dev`; include the same labels; auto-close issues with "Fixes #ID".
- Specs: keep long-form in `.agent-os/specs/DATE-slug/spec.md`; reference from the initial Spec issue body.
