# Spec Requirements Document

> Spec: UI Sans Fonts and Item Link Fix
> Created: 2025-09-03

## Overview

Align the UI typography to sans-serif across the app for both English and Japanese and update the item list so clicking an item name navigates to the public view page instead of the admin page.

## User Stories

### Consistent sans-serif typography

As a visitor, I want all UI text to use sans-serif fonts (EN/JA), so that readability and visual consistency are improved across pages.

Detailed workflow: On any page, headings, body text, and UI elements render using the configured sans font stack without serif overrides.

### Item list links to public view

As a user browsing items, I want clicking an item name in the item list to open the public item view page, so that I can see the item details without being taken to admin editing.

Detailed workflow: From the item list, clicking the item name navigates to the public route for that item (e.g., `/objects/[id]`).

## Spec Scope

1. **Enforce sans-serif UI fonts** - Remove/replace any serif-specific font classes/usages with the configured sans stack.
2. **Respect existing font setup** - Continue to use `Inter` and `Noto Sans JP` via `lib/fonts.ts` and Tailwind `fontFamily.sans`.
3. **Default body remains sans** - Ensure `app/layout.tsx` keeps `body` as `font-sans` and no component overrides to serif remain.
4. **Fix item name link target** - Update the item list so the item name routes to the public item view (e.g., `/objects/[id]`) instead of admin.

## Out of Scope

- Typography scale, spacing, or color adjustments beyond font family.
- Broader visual redesign or component refactors unrelated to font family.
- Admin workflows other than correcting the link target for the item name.

## Expected Deliverable

1. All visible UI text renders in sans-serif across English and Japanese locales in typical flows.
2. Clicking an item name in the item list navigates to the public item view page URL.

## References

- Issue #51: serif'ed fonts should be changed to san serif fonts — https://github.com/Joi/chanoyu-db/issues/51
- Issue #50: clicking the item name in the item list currently send you to the admin page for the item, but it should send you to the view page — https://github.com/Joi/chanoyu-db/issues/50


