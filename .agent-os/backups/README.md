# Agent OS Backups

This directory contains completed Agent OS specifications and documentation that have been implemented and merged.

## Directory Structure

### `/specs/`
Contains completed project specifications that have been fully implemented with merged PRs:

- **2025-09-07-bug-fixes-ui-updates** - Bug fixes and UI improvements (PR #95)
- **2025-09-06-rls-performance-fix** - RLS policies optimization (PR #90)  
- **2025-09-06-migration-consolidation** - Database migration consolidation (PR #85)
- **2025-09-05-simplify-git-workflow** - Git workflow simplification (PR #82)
- **2025-09-04-chakaiki-pdf-access** - PDF access for chakai (PRs #75,76,79,80)
- **2025-09-03-ui-sans-fonts-item-link** - UI fonts and item links (PRs #52,54)
- **2025-09-03-ui-update-part-ii** - UI updates part II (PR #58)
- **2025-09-01-minimal-ui-polish** - Minimal UI polish
- **2025-09-01-workflow-transition** - Workflow transition
- **ui-update-20250903** - UI update legacy

## Workflow Integration

Completed specs are automatically moved to backups as part of the post-execution workflow when:
1. All GitHub issues associated with the spec are closed
2. Related PRs have been merged to main
3. Implementation is verified complete

## Access

These specs remain accessible for:
- Historical reference
- Documentation of implementation decisions
- Troubleshooting and maintenance
- Learning from past approaches

Active specs remain in `.agent-os/specs/` until completion.