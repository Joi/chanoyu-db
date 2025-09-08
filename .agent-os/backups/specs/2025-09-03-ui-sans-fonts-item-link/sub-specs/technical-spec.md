# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-09-03-ui-sans-fonts-item-link/spec.md

## Technical Requirements

- Ensure `body` uses `font-sans` and remove residual `font-serif` overrides unless explicitly required for content samples.
- Uphold the configured font stacks in `tailwind.config.ts`:
  - `fontFamily.sans`: `Inter`, `Noto Sans JP`, system sans.
  - `fontFamily.serif`: `EB Garamond`, `Noto Serif JP` (not used by default UI).
- Audit components for serif usages and replace with `font-sans` where present.
- Update item list link: ensure item name links to public view route for the item (e.g., `/objects/[id]`).
- Do not change color, spacing, or typographic scale.

## External Dependencies (Conditional)

No new dependencies required.
