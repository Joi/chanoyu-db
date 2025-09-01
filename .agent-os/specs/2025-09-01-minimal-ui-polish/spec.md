# Spec Requirements Document

> Spec: minimal-ui-polish  
> Created: 2025-09-01

## Overview

Elevate the site’s visual quality with a minimal, museum-grade interface built on Tailwind + Next.js, adding a tiny design system, polished list/detail layouts, mobile-first navigation, and a carefully chosen font stack. Maintain top performance and simplicity—no heavy frameworks.

## User Stories

### Browse Objects Cleanly
As a visitor, I want a clean, responsive grid of tea utensils with stable image layout so that I can scan the collection quickly on mobile or desktop.
- Grid auto-fills cards (min 240px) with consistent aspect ratios (4:3).
- Titles clamp to two lines with subtle hover states.
- Images use `next/image` with blur placeholders and no layout shift.

### Read “Museum-grade” Detail
As an enthusiast, I want an elegant object page with a large image and well-structured metadata so that I can understand a piece at a glance and dig into notes comfortably.
- Primary image left (desktop), metadata right; stacked on mobile.
- Notes render with `prose` typography; metadata uses semantic `<dl>`.

### Quick, Non-intrusive Navigation
As a mobile user, I want a compact header and a slide-in menu so that I can search and navigate with minimal taps and no clutter.
- Header shows site title and search trigger.
- A Sheet/Drawer reveals nav & filters; full-screen search overlay on mobile.

## Spec Scope

1. **Design Tokens** – Add restrained palette, radii, shadows, spacing, and typography defaults via Tailwind `extend`.
2. **Typography** – Wire `next/font` for:
   - UI: Inter + Noto Sans JP
   - Titles: EB Garamond + Noto Serif JP
3. **Core Primitives** – Implement `Container`, `Card`, `Title`, `Muted`, `Separator`, `Button`.
4. **Objects Grid** – Responsive `auto-fill/minmax` grid with blur images and line-clamp titles.
5. **Object Detail** – Large image panel, metadata `<dl>`, `prose` notes, sticky mobile actions.
6. **Mobile Navigation** – Header + Sheet/Drawer nav with search overlay.
7. **Performance Hygiene** – Server components first, lazy images, bundle discipline.

## Out of Scope

- Database schema changes.
- New API endpoints or search backend changes.
- Full redesign of information architecture or URLs.

## Expected Deliverable

1. Objects index renders a responsive grid with stable image layout, two-line title clamps, and Lighthouse ≥ 90 mobile.
2. Object detail page presents metadata with semantic layout and `prose` notes, passes axe accessibility scan.
3. Header + mobile Sheet/Drawer nav works with keyboard and `prefers-reduced-motion`, while Core Web Vitals remain “Good”.
