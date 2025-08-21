# Local Classes (Metaclassification) – TODO

## Branch: feature/local-classes

### Schema (Supabase/Postgres)
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

### Server (APIs)
- [x] New route `/api/search/local-classes` (search by `q`)
- [x] Sanitize search input to mitigate injection and wildcard abuse
- [x] Admin actions to create/edit Local Classes
- [x] Admin actions to add/remove external links; set preferred

- ### Admin UI
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

### JSON-LD / Data Resolution
- [ ] Update `lib/jsonld.ts` to resolve external classification via Local Class preferred link
- [ ] Fallback logic when no external link exists

### Backfill (Staged)
- [ ] Seed initial Local Classes for top external classifications
- [ ] Map existing objects to `primary_local_class_id` where possible
- [ ] Keep `object_classifications` in place during transition

### Testing
- [ ] Unit tests for closure maintenance and cycle prevention
- [ ] API tests for `/api/search/local-classes`
- [ ] Security test: search input sanitization
- [ ] Integration tests for object admin flow
- [ ] JSON-LD tests for preferred external resolution

### Documentation
- [x] Update `README.md` overview section
- [x] Add developer notes to `docs/ARCHITECTURE.md`
- [x] Add admin usage notes to `docs/WORKFLOW.md`

### Later (Phase 2+)
- [ ] Tree UI improvements (drag-to-move, reorder)
- [ ] Merge/split Local Classes tool
- [ ] Trigram indexes for faster search if needed


