## Local Classes (Metaclassification) Feature Plan

### Objectives
- **Unify classifications** under a single local entity (“Local Class”) that clusters multiple external concepts (AAT/Wikidata) referring to the same thing.
- **Make item classification fast and consistent** by searching/selecting Local Classes only during object editing.
- **Support hierarchy** (nested classes). Each object links primarily to a single Local Class; UI shows that class and its parent chain. Reports can include all descendants for a class.
- **Preserve interoperability** by linking Local Classes to external concepts and designating a preferred external for JSON-LD/export.

### Summary
- Introduce `local_classes` with a human-friendly ID `ITO-C-00001` and a short `token`.
- Objects store a single primary link to a Local Class.
- Local Classes can link to many external `classifications` (AAT/Wikidata), with one preferred.
- Local Classes form a tree via `parent_id` and a closure table for fast descendant queries.
- Admin item workflow uses only Local Class search; external reconciliation is managed separately on Local Class pages.

### Data Model Changes (Postgres/Supabase)
- `local_classes`
  - `id uuid pk`
  - `token text unique` (mint via existing nanoid)
  - `local_number text unique not null` (human ID, e.g., `ITO-C-00001`)
  - `label_en text`, `label_ja text`, `description text`
  - `parent_id uuid null references local_classes(id) on delete set null`
  - `preferred_classification_id uuid references classifications(id) null`
  - `status text check ('active','draft','deprecated') default 'active'`
  - `created_at timestamptz default now()`, `updated_at timestamptz default now()`
  - Generation: sequence `local_class_local_seq` + trigger `set_local_class_local_number()` → `ITO-C-` + zero-padded NNNNN
- `local_class_links`
  - `local_class_id uuid references local_classes(id) on delete cascade`
  - `classification_id uuid references classifications(id) on delete cascade`
  - `is_preferred boolean default false`
  - `confidence smallint null`, `note text null`
  - `primary key (local_class_id, classification_id)`
- `local_class_hierarchy` (closure table)
  - `ancestor_id uuid references local_classes(id) on delete cascade`
  - `descendant_id uuid references local_classes(id) on delete cascade`
  - `depth int not null` (0 for self)
  - `primary key (ancestor_id, descendant_id)`
  - Maintained by triggers when `parent_id` changes; reject cycles
- Objects → Local Class (primary link)
  - Column on `objects`: `primary_local_class_id uuid references local_classes(id)`
  - Optional later: `object_local_classes(object_id, local_class_id, role)` for secondary roles

### RLS, Indexes, and Views
- Enable RLS:
  - `local_classes`, `local_class_links`, `local_class_hierarchy` → public read (mirror `classifications`)
  - If using `object_local_classes`, allow select only when the underlying object is public (mirror `oc_public_read`)
- Indexes:
  - `local_classes(token) unique`, `local_classes(local_number) unique (case-insensitive)`
  - `local_classes(parent_id)` for authoring/tree ops
  - `local_class_links(local_class_id)`, `(classification_id)`
  - `local_class_hierarchy(ancestor_id)`, `(descendant_id)`
- Counts views:
  - `local_class_object_counts_direct(local_class_id, object_count)` using direct assignments
  - `local_class_object_counts_total(local_class_id, object_count)` via closure table to include descendants

### API Changes
- New: `/api/search/local-classes`
  - Input: `q` (matches `label_en`, `label_ja`, `local_number`)
  - Output: `id`, `token`, `local_number`, `label_en`, `label_ja`, `parent_path` (for display), `object_count_direct`, `object_count_total`
  - Security: sanitize/escape the search term to avoid PostgREST OR/LIKE injection
- Keep `/api/lookup` for AAT/Wikidata to support admin reconciliation within Local Class detail pages.

### Admin UI Changes
- Object edit page (`/admin/[token]`)
  - Replace AAT/Wikidata lookup with Local Class search-only panel
  - On selection, set `objects.primary_local_class_id`
  - Show breadcrumb: selected class → parent → … root
- Local Classes admin
  - Index: list `local_number`, labels, parent, `object_count_total`, preferred external
  - Detail: edit labels/description/status/parent; manage external links (search AAT/Wikidata, add/remove, set preferred); view objects directly assigned; show total with descendants; tree ops (move/merge/split in later phase)

### JSON-LD Resolution
- When building Linked Art for an object, resolve external classification via the object’s Local Class:
  - Use `preferred_classification_id` if present
  - Else the first `local_class_links.is_preferred = true`
  - Else any linked external
  - Fallback to emitting Local Class label as plain text if no external link exists

### Migration / Backfill Plan
1. Create schema (tables, sequence, triggers, views, RLS) idempotently.
2. Seed initial Local Classes for the most common external classifications; set preferred external.
3. Backfill objects: set `primary_local_class_id` where a clear mapping exists (based on their current primary external classification).
4. Switch admin item editing to Local Class search. Keep existing `object_classifications` for compatibility during transition.
5. Update JSON-LD to use Local Class resolution once coverage is sufficient.

### Reporting and Queries
- “All items in a class including subcategories”:
  - `SELECT o.* FROM objects o WHERE o.primary_local_class_id IN (SELECT descendant_id FROM local_class_hierarchy WHERE ancestor_id = $1);`
- Breadcrumbs:
  - Use closure table rows with `descendant_id = $classId` ordered by `depth DESC` (or a recursive CTE)

### Risks and Mitigations
- Hierarchy complexity: use closure table + triggers to keep read paths fast and prevent cycles.
- Dual systems during transition: keep `object_classifications` intact; resolve JSON-LD via Local Class only when safe.
- Search performance: start with ILIKE; add trigram indexes if needed after usage data.
- Debug endpoints: restrict to non-production and require admin to reduce info disclosure.

### Phased Rollout
- Phase 1: Schema, search API, object admin switch to Local Classes, basic Local Classes admin (links + preferred).
- Phase 2: Backfill, JSON-LD switch, improved tree UI (drag/move), merge/split tools, tests and docs.


