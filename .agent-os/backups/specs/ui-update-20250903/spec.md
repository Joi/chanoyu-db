# Spec Requirements Document

> Spec: ui-update-20250903
> Created: 2025-09-03

## Overview

Improve UI clarity and consistency across navigation and collection views to enhance usability and reduce user friction.

## User Stories

### Faster page discovery via clearer navigation

As a visitor, I want clearer navigation labels and hierarchy, so that I can quickly find members, objects, chakai, and media pages.

- From any page, the primary nav surfaces top-level sections with consistent wording
- Active section is visually indicated; related sub-pages are discoverable within 1 click

### More scannable collection listings

As a researcher, I want more readable collection grids and tables, so that I can scan items faster and decide where to click next.

- Card titles wrap predictably; secondary metadata is muted yet legible
- Placeholder states avoid layout shift; loading shows skeletons

## Spec Scope

1. **Navigation labeling polish** - Align labels and active states for top-level sections.
2. **Collections grid readability** - Harmonize typography, spacing, and truncation behavior.
3. **Skeleton/loading states** - Use consistent skeleton components to reduce layout shift.

## Out of Scope

- New data fields or API endpoints
- Changes to authentication or RLS policies

## Expected Deliverable

1. Navigation labels and active states are consistent across pages.
2. Collection views use consistent typography, spacing, and skeletons.
3. Changes are visible in the browser and pass existing tests.
