# Ops workflow cheat sheet

## Environments

- local: run on your laptop for fast iteration (using Docker Supabase)
- preview (Vercel): hosted builds for feature branches (automatic preview deployments)
- prod (Vercel): hosted Production (tracks the `main` branch)

## One‑time setup

```bash
# ensure main branch exists and is tracked
git checkout -B main && git push -u origin main
```

Vercel project settings:

- Git → Production Branch: `main` (auto‑deploy on push: ON)
- Domains:
  - `collection.ito.com` → connect to Environment: Production
- Environment Variables: set values in Production environment
- Automatic Preview Deployments: ON (creates previews for all branches)

## Daily dev loop

```bash
# 1) work locally with Docker Supabase
supabase status  # ensure local environment is running
pnpm dev

# 2) create feature branch from main and push for preview
git checkout main && git pull origin main
git checkout -b feature/descriptive-name-123
git add -A && git commit -m "feat: add feature description (closes #123)"
git push origin feature/descriptive-name-123
# → Vercel automatically creates preview deployment for the branch
```

## Feature branch workflow with GitHub Issues

- Source of truth for planning: GitHub Issues (no local markdown task lists).
- Create descriptive feature branches directly from `main`; open PR directly to `main`.
- Specs live under `.agent-os/specs/YYYY-MM-DD-slug/` and are linked from the initial Spec issue.

Feature branch naming:

```bash
git checkout main && git pull origin main
git checkout -b feature/descriptive-name-123  # 123 = issue number
```

Labels (suggested):

- type:feature | type:bug | type:chore | type:docs
- area:frontend | area:api | area:db | area:admin | area:media | area:workflow | area:docs
- priority:P0 | priority:P1 | priority:P2
- state:ready | state:blocked | state:needs-spec
- feature:<slug>

Optional milestone: "Feature: Short Name" to group related issues.

Minimal bootstrap (requires GitHub CLI `gh`):

```bash
scripts/feature-bootstrap.sh <slug> "Human-friendly feature title"
```

This will:
- Create/checkout `feature/<slug>` from `main`
- Create a spec folder `.agent-os/specs/YYYY-MM-DD-<slug>/`
- Open an initial Spec issue labeled `feature:<slug>` and `state:needs-spec`
- Open a draft PR `feature/<slug> → main`

Optional: fast preview deploy from your working tree (skips GitHub build queue)

```bash
vercel              # preview deployment of local tree
# or faster if you already built locally
npm run build && vercel --prebuilt
```

## Preview verification before promoting to production

Run this after you're done with local dev and before you merge to `main` to ensure Vercel Preview matches local.

```bash
# 0) ensure local tree is linked to the correct Vercel project
vercel link --yes

# 1) pull Preview env vars and settings locally
vercel pull --yes --environment=preview

# 2) reproduce Vercel's build locally (uses .vercel/project.json and env)
pnpm install --frozen-lockfile
pnpm lint && pnpm typecheck && pnpm test
vercel build --yes

# 3) deploy to Preview and verify
git push origin feature/your-branch-name    # triggers Vercel Preview build for the branch
# or deploy your local prebuilt output if needed:
# vercel deploy --prebuilt --yes

# 4) confirm the deployment is healthy
vercel ls | cat                 # find the latest preview URL
vercel inspect <deployment-url> | cat
vercel logs <deployment-url> --since 15m | cat

# 5) manual smoke test at the generated preview URL
# Vercel provides unique URLs for each branch deployment
```

## Promote to production

Preferred (via PR using GitHub CLI):

```bash
# create a PR from feature branch → main that closes an issue (e.g., #34)
git push origin feature/descriptive-name-34
cat > /tmp/pr_body.md <<'EOF'
This implements the migration to Local Classes.

Closes #34.
EOF
gh pr create --base main --head feature/descriptive-name-34 --title "feat: remove direct classification links" --body-file /tmp/pr_body.md

# review status
gh pr view --web

# after checks pass, merge the PR (squash by default)
gh pr merge --squash --delete-branch

# pull latest main locally
git checkout main && git pull --ff-only
```

### Local Classes rollout notes

- After merging the Local Classes feature to `main`, apply the SQL (idempotent) to the production Supabase project:
  - Run the core schema block (tables, sequence, triggers, RLS)
  - If `objects` exists, run the counts views block
  - Then: `notify pgrst, 'reload schema'; notify pgrst, 'reload config';`
- Verify:
  - Admin → Local Classes: create/edit classes; attach AAT/Wikidata via pulldown; set preferred; bottom shows items in class
  - Admin → Object: top shows current Local Class (linked), breadcrumb, and external links; change Local Class via pulldown at bottom
Direct (CLI merge) - Not recommended, use PR workflow instead:

```bash
git checkout main
git pull --ff-only
git merge --no-ff feature/branch-name
git push origin main
# → Vercel builds Production → https://collection.ito.com
```

Emergency (avoid when possible):

```bash
vercel --prod  # deploy local tree straight to Production
```

## Env vars

- Using a single Supabase for Preview + Production → use the same values in both Vercel environments:
  - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY (server‑only)
  - AAT_RECONCILE_URL, GOOGLE_TRANSLATE_API_KEY, NOTION_* (optional)
- Local sync of Vercel envs:

```bash
vercel env pull .env.local
```

## Handy commands

```bash
# see last deployment URLs
vercel ls | cat

# open current project dashboard
vercel open

# inspect a specific deployment
vercel inspect <deployment-url>
```

## Notes

- “Preview” on Vercel is the environment for any non‑production branch. Mapping the domain to branch `dev` gives you a stable dev URL.
- Keep secrets unprefixed (server‑only). Only NEXT_PUBLIC_* can appear in browser.

---

## Coordinating schema changes across stacks

- Shared contract lives under `supabase/` (SQL, migrations, RLS). If a migration affects both the web app and ingestion, keep the edits in a single PR.
- Order of operations for a coupled change:
  1) Write/update migration in `supabase/`
  2) Update ingestion code under `ingestion/` if it queries affected tables/columns
  3) Update web app under `app/`/`lib/`/`components/`
  4) Include a brief verification checklist in the PR description
- For safety, prefer idempotent SQL and include rollback notes when possible

## CI path filters

- Run Node jobs only when `app/**`, `lib/**`, `components/**`, or Node lockfiles change
- Run Python jobs only when `ingestion/**`, `requirements*.txt`, or Python sources/tests change
- Always run SQL checks when `supabase/**` changes

See `docs/CI_MONOREPO.md` for a drop-in GitHub Actions example.
