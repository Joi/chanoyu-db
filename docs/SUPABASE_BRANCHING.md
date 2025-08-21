## Supabase branching and safe reverts

To iterate on schema safely for `feature/local-classes`, use a separate Supabase project or local CLI DB. This avoids breaking the shared dev database and gives easy revert.

### Option A: Separate cloud project (recommended)
1. Create a new Supabase project for this branch.
2. Copy `ENV.local-classes.example` to `.env.local` and fill in values from the new project.
3. Run the app with `pnpm dev`. Migrations in `supabase/migrations` are additive and idempotent.
4. Revert: switch `.env.local` back to your shared dev project credentials.

### Option B: Local DB via Supabase CLI
1. Install CLI: `brew install supabase/tap/supabase`
2. Start local stack: `supabase start`
3. Apply migrations: `supabase db reset` (recreates and applies all migrations)
4. Connect the app using the local URL/keys the CLI prints.
5. Revert: `supabase db reset` again or `supabase stop` to discard.

### Reversible migrations guidance
- The `20250821_local_classes.sql` migration only adds new tables/columns and is safe to apply. If needed, you can drop these objects to revert.
- Avoid destructive changes to existing tables. The only existing-table change is a new nullable column `objects.primary_local_class_id`.
- Always take a backup (pg_dump) before applying to shared environments if you are not using a separate project.

### Environment variables used
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Set these in `.env.local` for the project you want to target (cloud or local CLI).


