## Plan: Remove Summary field from items and update Notion ingest

### Goal
Eliminate `summary` and `summary_ja` from item objects to avoid duplication with `notes` and align ingestion/UI accordingly.

### Scope of changes
- Database schema (migrations and docs)
- Admin UI for objects
- Public object page and JSON-LD
- Ingestion script for Notion
- Types and tests
- Developer docs

### A. Database
1) Create a new migration to deprecate columns, not drop immediately:
   - `supabase/migrations/2025082x_remove_summary_from_objects.sql`
   - Steps:
     - Add generated columns for backward compatibility if needed, but prefer app-level removal first.
     - Mark `summary`/`summary_ja` as deprecated in docs.
   - Follow-up migration (after deploy): drop columns safely.

2) Update docs:
   - `README.md` and `db.md`: remove `summary, summary_ja` from objects field lists.

### B. Backend/Lib
1) JSON-LD builder `lib/jsonld.ts`:
   - Remove `summary` and `summary_ja` from `ObjectRow` type.
   - Stop emitting `summary` array; instead, if needed later, map `notes/notes_ja` to a single descriptive field or omit.

2) JSON-LD route `app/id/[token]/jsonld/route.ts`:
   - Stop selecting `summary, summary_ja` from objects.
   - Pass the updated object type to `buildLinkedArtJSONLD`.

### C. Admin UI
`app/admin/[token]/page.tsx`:
- Form schema: remove `summary` fields from Zod schema.
- Data fetch select: remove `summary, summary_ja`.
- Auto-translate: remove cases for `summary` and `summary_ja`.
- Update action: remove reading `summary` inputs and `update.summary*` assignments.
- JSX: remove the "Summary (EN/JA)" textarea fields and translate buttons.

### D. Public Object Page
`app/id/[token]/page.tsx`:
- Query: remove `summary, summary_ja`.
- Rendering: remove paragraphs that display summaries; keep `notes/notes_ja` as the descriptive text.

### E. Ingestion
`scripts/ingest-notion.ts`:
- Remove env props `NOTION_SUMMARY_EN_PROP` and `NOTION_SUMMARY_JA_PROP` handling.
- Remove logic computing `summary/summary_ja` and writing to upsert.
- If a Notion "Summary" exists, map it to `notes/notes_ja` instead (only when `notes` empty) to preserve content.

### F. Types and Tests
- `lib/jsonld.ts` test `tests/jsonld.test.ts`: adjust fixture object type (no summaries) and expectations (no `summary` key in output).
- Ensure no interfaces depend on `summary`.

### G. Rollout Plan
1) Code-first removal with columns still present (no references).
2) Deploy to dev; validate UI, JSON-LD, and ingestion.
3) Once stable, run migration to drop columns:
   - `alter table objects drop column if exists summary;`
   - `alter table objects drop column if exists summary_ja;`

### Files to edit
- `lib/jsonld.ts`
- `app/id/[token]/jsonld/route.ts`
- `app/id/[token]/page.tsx`
- `app/admin/[token]/page.tsx`
- `scripts/ingest-notion.ts`
- `tests/jsonld.test.ts`
- `README.md`, `db.md`
- `supabase/migrations/2025082x_remove_summary_from_objects.sql` (new)

### Acceptance checklist
- Admin UI has no Summary fields and saves fine.
- Public page shows description via `notes` only.
- JSON-LD has no `summary` property.
- Notion ingest populates `notes/notes_ja` and never writes `summary*`.
- Docs reflect schema without summaries.


