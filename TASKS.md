# Current Tasks

## In Progress

<!-- Move tasks here when someone starts working on them -->

## TODO This Week

<!-- Priority tasks for the current week -->
- [x] Implement role-aware landing in `app/page.tsx` (Epic: Landings & Nav)
- [x] Honor validated `next` in `/login` redirect (Epic: Landings & Nav)
- [x] Make NavBar role-aware with English-only labels (Epic: Landings & Nav)
- [x] Create `app/members/page.tsx` with quick actions (Epic: Landings & Nav)
- [x] Centralize entity copy in `lib/branding.ts` (Epic: Landings & Nav)
  
  New polish tasks:
  - [x] Admin landing header: bilingual EN/JA help text
  - [x] NavBar link styling: make all items consistent (no mixed styles)
  - [x] Unify terminology: use “Members” everywhere (remove “Accounts” label)

## Active Epics

<!--
### Epic: Role‑aware Landings & English NavBar

- Owner: @joi
- Spec: [docs/FEATURE_SPEC_landings_and_nav.md](docs/FEATURE_SPEC_landings_and_nav.md)
- Branch: `dev`
- Status: Planning

#### Scope & Checklist — Role‑aware Landings & English NavBar

- Routing and auth
  - [x] Implement role-aware landing in `app/page.tsx` (server)
  - [x] Ensure `/login` honors validated `next` with role-based fallback
  - [x] Add role helper returning `owner|admin|member|visitor` and linked Member id
- Members landing
  - [x] Create `app/members/page.tsx` with quick actions and recent activity
  - [ ] Show prompts when Account lacks linked Member (create or select)
- Admin landing
  - [x] Redesign `app/admin/page.tsx` to management cards with EN/JA help
- NavBar
  - [x] Make NavBar role-aware with English-only labels; hide privileged links
  - [ ] Ensure consistent link styling across menus
- Copy and tooltips
  - [x] Centralize labels/CTAs/descriptions in `lib/branding.ts` (or extend `lib/translate.ts`)
  - [x] Add tooltips: Local Classes — "Project taxonomy (ローカル分類)"; Classifications — "External authorities (AAT/Wikidata)"
  - [ ] Admin landing header help bilingual (EN/JA)
- JSON-LD and model alignment
  - [ ] Confirm external types resolve via Local Class preferred Classification in `lib/jsonld.ts` and related routes
- Tests and QA
  - [x] Add tests: login `next`, role-based defaults, NavBar visibility by role
- Documentation
  - [x] Cross-link `docs/ARCHITECTURE.md` and `docs/PLAN_remove_direct_classification_links.md` from the spec
  - [x] Create spec: Members terminology unification; NavBar styling; Admin help bilingual
- Accessibility and responsiveness
  - [ ] Verify focus states, touch targets (≥44px), contrast; ensure EN/JA copy does not overflow

#### Task Breakdown (for execution)

1. RA-1 Routing and auth
   - [ ] Implement role-aware landing in `app/page.tsx` (server)
   - [ ] Ensure `/login` honors validated `next` with role-based fallback
   - [ ] Add role helper returning `owner|admin|member|visitor` and linked Member id

2. RA-2 Members landing
   - [ ] Create `app/members/page.tsx` with quick actions and recent activity
   - [ ] Show prompts when Account lacks linked Member (create or select)

3. RA-3 Admin landing
   - [ ] Redesign `app/admin/page.tsx` to management cards with EN/JA help

4. RA-4 NavBar
   - [ ] Make NavBar role-aware with English-only labels
   - [ ] Hide privileged links for non-admins; ensure Members → `/members`, Accounts (admin) → `/admin/accounts`

5. RA-5 Copy and tooltips
   - [ ] Centralize labels/CTAs/descriptions in `lib/branding.ts` (or extend `lib/translate.ts`)
   - [ ] Add tooltips: Local Classes — "Project taxonomy (ローカル分類)"; Classifications — "External authorities (AAT/Wikidata)"

6. RA-6 JSON-LD and model alignment
   - [ ] Confirm external types resolve via Local Class preferred Classification in `lib/jsonld.ts`
   - [ ] Verify `app/id/[token]/jsonld/route.ts` and `app/api/ark/[naan]/[...name]/route.ts` align

7. RA-7 Tests and QA
   - [ ] Add tests: login `next`, role-based defaults, NavBar visibility by role
   - [ ] Manual test matrix: visitor/member/admin flows; mobile/desktop; no client flicker

8. RA-8 Documentation
   - [ ] Cross-link `docs/ARCHITECTURE.md` and `docs/PLAN_remove_direct_classification_links.md` from the spec
   - [ ] Ensure terminology (EN/JA) matches across docs

9. RA-9 Accessibility and responsiveness
   - [ ] Verify focus states, touch targets (≥44px), high contrast
   - [ ] Ensure EN/JA copy does not overflow cards on small screens
-->

### Epic: Members terminology unification & NavBar polish (EN/JA Admin help)

- Owner: @joi
- Spec: [docs/FEATURE_SPEC_members_unification_and_navbar_polish.md](docs/FEATURE_SPEC_members_unification_and_navbar_polish.md)
- Branch: `dev`
- Status: Ready to implement

#### Scope & Checklist — Members terminology unification & NavBar polish

- Branding and copy
  - [x] Add Members label constant in `lib/branding.ts`
  - [x] Replace visible "Accounts" with "Members" in NavBar and Admin surfaces
  - [ ] Keep `/admin/members` as the single management route; ensure `/admin/accounts` only redirects; remove any other aliases

- NavBar styling consistency
  - [x] Visitor: Home, Lookup, Login — uniform link styles (font/color/hover)
  - [x] Member: Members, Chakai, Tea Rooms, Lookup, Logout — uniform link styles
  - [x] Admin/Owner: Admin menu shows Members, Chakai, Items, Media, Local Classes, Classifications, Tea Schools, Members; plus Lookup and Logout — all links, consistent styling
  - [ ] Preserve tooltips for Local Classes and Classifications
  - [ ] Server-render role-aware state to avoid client-side flicker

- Admin landing header (bilingual)
  - [x] Add EN help text to header in `app/admin/page.tsx` per spec
  - [x] Add JA help text to header in `app/admin/page.tsx` per spec
  - [x] Ensure Tailwind styles match existing conventions and are responsive

- Tests and QA
  - [x] Update tests for Members label and NavBar visibility/labels by role
  - [x] QA: visitor sees Home/Lookup/Login uniformly styled as links
  - [x] QA: member sees Members/Chakai/Tea Rooms/Lookup/Logout uniformly styled as links
  - [x] QA: admin/owner sees full Admin menu + Lookup/Logout, all as links
  - [x] QA: Admin landing header shows both EN and JA lines

- Documentation
  - [x] Spec created and linked

#### Task Breakdown — Members terminology & NavBar polish

1. MU-1 Branding and copy
   - [x] Add `members` label in `lib/branding.ts`
   - [x] Replace "Accounts" strings in `app/components/NavBar.tsx` and `app/components/NavBarClient.tsx`
   - [ ] Verify admin surfaces use "Members"; keep `app/admin/accounts/page.tsx` as redirect-only; remove other aliases

2. MU-2 NavBar styling consistency
   - [x] Normalize link element usage in `NavBar.tsx`/`NavBarClient.tsx`; remove mixed static text
   - [x] Unify Tailwind classes for link typography, color, hover/focus across visitor/member/admin
   - [ ] Preserve tooltips for Local Classes and Classifications

3. MU-3 Admin landing header (bilingual)
   - [x] Add EN and JA help lines to header in `app/admin/page.tsx` using spec copy
   - [x] Ensure responsive layout and no overflow for EN/JA strings

4. MU-4 Tests and QA
   - [x] Update `tests/navbar_visibility.test.ts` for "Members" label and uniform link styling
   - [x] Add/adjust tests as needed to cover admin header presence (EN/JA)
   - [ ] Manual QA matrix: visitor/member/admin; mobile/desktop; no client flicker

## Backlog

<!-- Future tasks, not urgent -->

### Epic: Migration — Remove direct item→classification links

- Goal: Items should link only to Local Classes; remove direct `object_classifications` usage in app code and admin UI.
- Owner: @joi (handoff-ready)
- Plan doc: [docs/PLAN_remove_direct_classification_links.md](docs/PLAN_remove_direct_classification_links.md)
- Branch: `remove-direct-classification-links` (pushed)
- Status: Supabase migration applied (RLS freeze, trigger, backfill, cleanup, view). Remaining: fallback logic.

#### Scope & Checklist — Migration

- [x] Schema: freeze writes to `object_classifications` (keep for legacy reads if needed)
- [x] Admin Object Page: remove add/list of direct classifications; rely on `primary_local_class_id`
- [x] Public Object Page: show Local Class + breadcrumb; drop direct classifications list
- [x] JSON-LD endpoints: resolve types via Local Class preferred external link
- [x] ARK endpoint: same as JSON-LD
- [x] Admin Classification Pages: repurpose to show linked Local Classes; remove item link/unlink; add preferred controls
- [x] LookupPanel: remove old object-page use (file deleted)
- [x] Tests: add/update tests for JSON-LD resolution via Local Class
- [x] Docs: update `docs/ARCHITECTURE.md` classification flow
- [x] Backfill: ensure each object has `primary_local_class_id` where possible
- [x] Scripts: update `scripts/seed-object.ts` to seed via Local Classes
- [ ] Feature flag/deploy plan: staged rollout with toggle if needed

### Epic: Local Classes (Metaclassification)

Branch: `feature/local-classes`

#### Schema (Supabase/Postgres)

- [x] Create table `local_classes`
- [x] Create sequence `local_class_local_seq`
- [x] Create trigger/function `set_local_class_local_number()` → `ITO-C-00001`
- [x] Add column `objects.primary_local_class_id`
- [x] Create table `local_class_links`
- [x] Create table `local_class_hierarchy` (closure)
- [x] Triggers to maintain closure on insert/update of `parent_id`
- [x] Trigger/constraint to prevent cycles in hierarchy
- [x] RLS: public read on `local_classes`, `local_class_links`, `local_class_hierarchy`
- [x] Indexes: unique on `token`, case-insensitive unique on `local_number`, parent_id, closure indexes
- [x] Views: `local_class_object_counts_direct`, `local_class_object_counts_total`

#### Server (APIs)

- [x] New route `/api/search/local-classes` (search by `q`)
- [x] Sanitize search input to mitigate injection and wildcard abuse
- [x] Admin actions to create/edit Local Classes
- [x] Admin actions to add/remove external links; set preferred

#### Admin UI

- [x] Replace classification panel on `/admin/[token]` to search Local Classes only
- [x] Display counts (direct and optionally total) in search results
- [x] Show breadcrumb for selected Local Class on object page
- [ ] Local Classes index page `/admin/local-classes`
- [x] Local Class detail page `/admin/local-classes/[id]`
  - [x] Edit labels/description/status/parent
  - [x] Manage external links (attach existing pulldown; add new; preferred)
  - [x] Show objects (direct) and aggregate count with descendants
  - [x] Parent/child attach/detach
- [x] Local Classes new page `/admin/local-classes/new` (parent pulldown, optional AAT/WD attach)

#### JSON-LD / Data Resolution

- [x] Endpoints resolve external classification via Local Class preferred link
- [ ] Fallback logic when no external link exists

#### Backfill (Staged)

- [ ] Seed initial Local Classes for top external classifications
- [x] Map existing objects to `primary_local_class_id` where possible
- [x] Keep `object_classifications` in place during transition

#### Testing

- [ ] Unit tests for closure maintenance and cycle prevention
- [ ] API tests for `/api/search/local-classes`
- [ ] Security test: search input sanitization
- [ ] Integration tests for object admin flow
- [ ] JSON-LD tests for preferred external resolution

#### Documentation

- [x] Update `README.md` overview section
- [x] Add developer notes to `docs/ARCHITECTURE.md`
- [x] Add admin usage notes to `docs/WORKFLOW.md`

#### Later (Phase 2+)

- [ ] Tree UI improvements (drag-to-move, reorder)
- [ ] Merge/split Local Classes tool
- [ ] Trigram indexes for faster search if needed

## Completed

- [x] Refactor `TASKS.md` structure for epics and weekly tracking (2025-08-31)
- [x] Local Classes admin UX: external link attach, top summary on item page, bottom change form, list items in class (2025-08-21)
<!-- Move completed tasks here with date -->

### Completed Epics

### Epic: Role‑aware Landings & English NavBar

- Owner: @joi
- Spec: [docs/FEATURE_SPEC_landings_and_nav.md](docs/FEATURE_SPEC_landings_and_nav.md)
- Branch: `dev`
- Status: Completed (2025-08-31)

#### Scope & Checklist — Role‑aware Landings & English NavBar

- Routing and auth
  - [x] Implement role-aware landing in `app/page.tsx` (server)
  - [x] Ensure `/login` honors validated `next` with role-based fallback
  - [x] Add role helper returning `owner|admin|member|visitor` and linked Member id
- Members landing
  - [x] Create `app/members/page.tsx` with quick actions and recent activity
  - [x] Show prompts when Account lacks linked Member (create or select)
- Admin landing
  - [x] Redesign `app/admin/page.tsx` to management cards with EN/JA help
- NavBar
  - [x] Make NavBar role-aware with English-only labels; hide privileged links
  - [x] Ensure consistent link styling across menus
- Copy and tooltips
  - [x] Centralize labels/CTAs/descriptions in `lib/branding.ts` (or extend `lib/translate.ts`)
  - [x] Add tooltips: Local Classes — "Project taxonomy (ローカル分類)"; Classifications — "External authorities (AAT/Wikidata)"
  - [x] Admin landing header help bilingual (EN/JA)
- JSON-LD and model alignment
  - [x] Confirm external types resolve via Local Class preferred Classification in `lib/jsonld.ts` and related routes
- Tests and QA
  - [x] Add tests: login `next`, role-based defaults, NavBar visibility by role
- Documentation
  - [x] Cross-link `docs/ARCHITECTURE.md` and `docs/PLAN_remove_direct_classification_links.md` from the spec
  - [x] Create spec: Members terminology unification; NavBar styling; Admin help bilingual
- Accessibility and responsiveness
  - [x] Verify focus states, touch targets (≥44px), contrast; ensure EN/JA copy does not overflow

#### Task Breakdown — Role‑aware Landings & English NavBar

1. RA-1 Routing and auth
   - [x] Implement role-aware landing in `app/page.tsx` (server)
   - [x] Ensure `/login` honors validated `next` with role-based fallback
   - [x] Add role helper returning `owner|admin|member|visitor` and linked Member id

2. RA-2 Members landing
   - [x] Create `app/members/page.tsx` with quick actions and recent activity
   - [x] Show prompts when Account lacks linked Member (create or select)

3. RA-3 Admin landing
   - [x] Redesign `app/admin/page.tsx` to management cards with EN/JA help

4. RA-4 NavBar
   - [x] Make NavBar role-aware with English-only labels
   - [x] Hide privileged links for non-admins; ensure Members → `/members`, Accounts (admin) → `/admin/accounts`

5. RA-5 Copy and tooltips
   - [x] Centralize labels/CTAs/descriptions in `lib/branding.ts` (or extend `lib/translate.ts`)
   - [x] Add tooltips: Local Classes — "Project taxonomy (ローカル分類)"; Classifications — "External authorities (AAT/Wikidata)"

6. RA-6 JSON-LD and model alignment
   - [x] Confirm external types resolve via Local Class preferred Classification in `lib/jsonld.ts`
   - [x] Verify `app/id/[token]/jsonld/route.ts` and `app/api/ark/[naan]/[...name]/route.ts` align

7. RA-7 Tests and QA
   - [x] Add tests: login `next`, role-based defaults, NavBar visibility by role
   - [x] Manual test matrix: visitor/member/admin flows; mobile/desktop; no client flicker

8. RA-8 Documentation
   - [x] Cross-link `docs/ARCHITECTURE.md` and `docs/PLAN_remove_direct_classification_links.md` from the spec
   - [x] Ensure terminology (EN/JA) matches across docs

9. RA-9 Accessibility and responsiveness
   - [x] Verify focus states, touch targets (≥44px), high contrast
   - [x] Ensure EN/JA copy does not overflow cards on small screens

---

## Task Format

When adding a task, use this simple format:

```markdown
- [ ] Brief description (#issue-number if exists) @assignee
```

Example:

```markdown
- [ ] Fix image upload for HEIC files (#23) @joi
```

## Notes for AI Tools

When asking Claude or Cursor to work on a task:

1. Reference the specific task from this file
2. Point to relevant files in the codebase
3. Mention which branch you're working on (usually `dev`)
