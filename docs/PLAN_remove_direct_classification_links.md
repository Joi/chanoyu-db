## Migration Plan: Remove direct item→classification links

Objective: Items should link only to Local Classes. Eliminate direct `object_classifications` interactions from app logic and UI, and resolve external types via each Local Class's preferred external link.

### 1) Database and Data Flow
- Keep `object_classifications` table for now (read-only or legacy), but stop all writes from the app.
- Ensure `objects.primary_local_class_id` is populated for objects during migration/backfill.
- Use `local_class_links` and `local_classes.preferred_classification_id` for JSON-LD external type resolution.

### 2) Code Changes by File (with line references)

1. `app/admin/[token]/page.tsx`
   - Remove direct classification write path and UI.
   - Edits:
     - Delete server action `saveClassificationAction` and the classification form/list.
       - Remove lines approximately 100–159 (server action) and 722–750 (UI list/form) where `object_classifications` are displayed and added.
     - Keep and emphasize Local Class selection via `savePrimaryLocalClassAction` (lines ~51–98) and the "Change Local Class" section (lines ~784–797).
     - Keep the compact classification summary that shows Local Class breadcrumb and external links (lines ~564–585), as it uses `local_class_links`.

2. `app/id/[token]/page.tsx`
   - Stop selecting `object_classifications` and remove the public list of classifications.
   - Edits:
     - In the `select(...)` for objects (lines ~21–26), drop the `object_classifications` nested selection.
     - Remove the `classifications` derivation (lines ~62–65) and the "Classifications" section UI (lines ~159–171).
     - Instead, fetch the object's `primary_local_class_id` and load its breadcrumb and preferred external links similar to the admin summary.
     - Pass resolved external types to JSON-LD via `buildLinkedArtJSONLD` (see item 4 below).

3. `app/id/[token]/jsonld/route.ts`
   - Stop reading `object_classifications`; resolve via Local Class preferred link.
   - Edits:
     - In object `select(...)` (lines ~13–19), remove `object_classifications` nesting.
     - After object fetch, if `primary_local_class_id` exists, load preferred external classification via `local_class_links` or `local_classes.preferred_classification_id`.
     - Build a normalized `classifications` array from the Local Class preferred external only and pass to `buildLinkedArtJSONLD`.

4. `app/api/ark/[naan]/[...name]/route.ts`
   - Same JSON-LD resolution change as above.
   - Edits:
     - In object `select(...)` (lines ~16–22), remove `object_classifications` nesting.
     - Load Local Class preferred external and pass to `buildLinkedArtJSONLD`.

5. `lib/jsonld.ts`
   - Accept classifications derived from Local Class only.
   - No change to function signature necessary, but plan to pass a single preferred external (or empty) instead of multiple direct links.
   - Ensure tests reflect single-source-of-truth via Local Class.

6. `app/admin/classifications/[id]/page.tsx`
   - Repurpose or de-emphasize object linking. Objects should not be linked here anymore.
   - Edits:
     - Remove forms and server actions that upsert/delete in `object_classifications` (lines ~90–117, 119–146).
     - Optionally, show Local Classes that link to this external classification using `local_class_links` and allow navigation to those Local Class pages.

7. `app/admin/[token]/lookup-panel.tsx`
   - Keep for finding external concepts but no longer wiring to object-level classification form.
   - Edits:
     - Remove coupling to `#classification-form` (lines ~61–68) and instead plan a future reuse under Local Class pages if needed.
     - For now, remove from Admin Object page entirely.

8. Tests
   - `tests/jsonld.test.ts`
     - Update to reflect that `buildLinkedArtJSONLD` will receive classifications resolved from Local Class preferred link(s).
     - Replace test input assembly to a single AAT or Wikidata record coming from Local Class preferred link, and assert the same Linked.Art output.

### 3) SQL/Policies Considerations
- Ensure RLS allows reading `local_class_links` and `local_classes` for public JSON-LD resolution.
- Consider a DB trigger or admin-only policy to block inserts to `object_classifications` from app roles (optional while UI writes are removed).

### 4) Backfill Steps (out of code)
- Map existing items to `primary_local_class_id` using their current `object_classifications` if possible.
- For Local Classes lacking `preferred_classification_id`, select the best linked external and set it.

### 5) Rollout Notes
- Sequence: deploy code changes (no writes), backfill `primary_local_class_id`, verify JSON-LD, then optionally lock `object_classifications` writes.
- Keep legacy classification admin pages accessible behind a feature flag or remove after verification.

---

If file line numbers shift, search for these key anchors:
- `object_classifications (` in `app/admin/[token]/page.tsx`, `app/id/[token]/page.tsx`, and both JSON-LD routes.
- `saveClassificationAction` in `app/admin/[token]/page.tsx`.
- `Add classification` section in admin object page.



