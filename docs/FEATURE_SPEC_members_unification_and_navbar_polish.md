### Spec: Members terminology unification, NavBar styling polish, bilingual Admin help

## Overview
- Objective: Align terminology by using “Members” everywhere (remove “Accounts”), make NavBar link styling consistent, and present bilingual (EN/JA) help on the Admin landing header.
- Outcome: Unified copy, cleaner navigation, clearer onboarding to Local Class vs Classification model in both English and Japanese.

## Scope
- Terminology: Replace visible mentions of “Accounts” with “Members” in navigation and admin surfaces; routes remain `/admin/members` (keep existing code path).
- NavBar styling: Ensure all menu items render as links with consistent visual style; no mixed non-link text alongside links.
- Admin landing header: Show help text in both EN and JA.

## Detailed Requirements
1) Members terminology unification
   - Replace label “Accounts” with “Members” anywhere it appears in the UI, including the Admin menu.
   - Keep the route `/admin/members` as the single management page for login identities and roles.
   - Remove any duplicate “Accounts” page link or alias beyond the existing redirect in `app/admin/accounts/page.tsx`.

2) NavBar styling consistency
   - Visitor: Home, Lookup, Login — all styled as links with the same font/color/hover.
   - Member: Members, Chakai, Tea Rooms, Lookup, Logout — all styled consistently as links.
   - Admin/Owner: Admin menu with Members, Chakai, Items, Media, Local Classes, Classifications, Tea Schools, Members; plus Lookup and Logout — ensure all are links; avoid mixed static text.
   - Tooltip support remains for Local Classes and Classifications.

3) Admin landing help (bilingual)
   - EN: “Local Class (ローカル分類) is our project’s category. Each item selects one primary Local Class. It may link to a preferred external Classification (AAT/Wikidata). Classifications (分類) are canonical external authorities; Items inherit via Local Classes.”
   - JA: “Local Classes（ローカル分類）は本プロジェクトの分類体系です。各アイテムは一つの主要ローカル分類を選びます。Classifications（分類; AAT/Wikidata）は外部の権威データで、ローカル分類から代表リンクとして参照します。”
   - Placement: `app/admin/page.tsx` header.

## Out of Scope
- Data model changes — no schema changes required.
- Route changes — continue using `/admin/members` for management.

## Implementation Notes
- Use existing `lib/branding.ts` for labels; add a single source for the “Members” label used in the NavBar and Admin surfaces.
- Ensure no client-side flicker when rendering NavBar (render role-aware state server-side as currently done).
- Match existing Tailwind conventions for colors and hover styles.

## Acceptance Criteria
- “Accounts” no longer appears in any visible NavBar labels; replaced by “Members”.
- NavBar shows all items as consistently styled links for visitor/member/admin contexts.
- Admin landing header shows bilingual help text (EN + JA) about Local Classes vs Classifications.

## QA Checklist
- Visitor: Home/Lookup/Login visible and styled uniformly.
- Member: Members/Chakai/Tea Rooms/Lookup/Logout visible and styled uniformly.
- Admin: Admin menu shows Members/Chakai/Items/Media/Local Classes/Classifications/Tea Schools/Members; Lookup + Logout present; all styled uniformly.
- Admin landing header displays both EN and JA help lines.


