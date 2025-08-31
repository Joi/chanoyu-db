# Current Tasks

## In Progress

<!-- Move tasks here when someone starts working on them -->

## TODO This Week

<!-- Priority tasks for the current week -->
- [ ] Implement role-aware landing in `app/page.tsx` (Epic: Landings & Nav)
- [ ] Honor validated `next` in `/login` redirect (Epic: Landings & Nav)
- [ ] Make NavBar role-aware with English-only labels (Epic: Landings & Nav)
- [ ] Create `app/members/page.tsx` with quick actions (Epic: Landings & Nav)
- [ ] Centralize entity copy in `lib/branding.ts` (Epic: Landings & Nav)

## Active Epics

### Epic: Role‑aware Landings & English NavBar

- Owner: @joi
- Spec: [docs/FEATURE_SPEC_landings_and_nav.md](docs/FEATURE_SPEC_landings_and_nav.md)
- Branch: `dev`
- Status: Planning

#### Scope & Checklist — Role‑aware Landings & English NavBar

- Routing and auth
  - [ ] Implement role-aware landing in `app/page.tsx` (server)
  - [ ] Ensure `/login` honors validated `next` with role-based fallback
  - [ ] Add role helper returning `owner|admin|member|visitor` and linked Member id
- Members landing
  - [ ] Create `app/members/page.tsx` with quick actions and recent activity
  - [ ] Show prompts when Account lacks linked Member (create or select)
- Admin landing
  - [ ] Redesign `app/admin/page.tsx` to management cards with EN/JA help
- NavBar
  - [ ] Make NavBar role-aware with English-only labels; hide privileged links
- Copy and tooltips
  - [ ] Centralize labels/CTAs/descriptions in `lib/branding.ts` (or extend `lib/translate.ts`)
  - [ ] Add tooltips: Local Classes — "Project taxonomy (ローカル分類)"; Classifications — "External authorities (AAT/Wikidata)"
- JSON-LD and model alignment
  - [ ] Confirm external types resolve via Local Class preferred Classification in `lib/jsonld.ts` and related routes
- Tests and QA
  - [ ] Add tests: login `next`, role-based defaults, NavBar visibility by role
- Documentation
  - [ ] Cross-link `docs/ARCHITECTURE.md` and `docs/PLAN_remove_direct_classification_links.md` from the spec
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
