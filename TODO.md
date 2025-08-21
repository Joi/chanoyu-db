# Local Classes (Metaclassification) – TODO

## Branch: feature/local-classes

### Schema (Supabase/Postgres)
- [ ] Create table `local_classes`
- [ ] Create sequence `local_class_local_seq`
- [ ] Create trigger/function `set_local_class_local_number()` → `ITO-C-00001`
- [ ] Add column `objects.primary_local_class_id`
- [ ] Create table `local_class_links`
- [ ] Create table `local_class_hierarchy` (closure)
- [ ] Triggers to maintain closure on insert/update of `parent_id`
- [ ] Trigger/constraint to prevent cycles in hierarchy
- [ ] RLS: public read on `local_classes`, `local_class_links`, `local_class_hierarchy`
- [ ] Indexes: unique on `token`, case-insensitive unique on `local_number`, parent_id, closure indexes
- [ ] Views: `local_class_object_counts_direct`, `local_class_object_counts_total`

### Server (APIs)
- [ ] New route `/api/search/local-classes` (search by `q`)
- [ ] Admin actions to create/edit Local Classes
- [ ] Admin actions to add/remove external links; set preferred

### Admin UI
- [ ] Replace classification panel on `/admin/[token]` to search Local Classes only
- [ ] Display counts (direct and optionally total) in search results
- [ ] Show breadcrumb for selected Local Class on object page
- [ ] Local Classes index page `/admin/local-classes`
- [ ] Local Class detail page `/admin/local-classes/[token]`
  - [ ] Edit labels/description/status/parent
  - [ ] Manage external links (search AAT/Wikidata; add/remove; preferred)
  - [ ] Show objects (direct) and aggregate count with descendants

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
- [ ] Integration tests for object admin flow
- [ ] JSON-LD tests for preferred external resolution

### Documentation
- [ ] Update `README.md` overview section
- [ ] Add developer notes to `docs/ARCHITECTURE.md`
- [ ] Add admin usage notes to `docs/WORKFLOW.md`

### Later (Phase 2+)
- [ ] Tree UI improvements (drag-to-move, reorder)
- [ ] Merge/split Local Classes tool
- [ ] Trigram indexes for faster search if needed


