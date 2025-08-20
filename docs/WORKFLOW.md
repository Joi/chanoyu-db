# Ops workflow cheat sheet

## Environments
- dev (local): run on your laptop for fast iteration
- preview (Vercel): hosted builds for non‑prod (tracks the `dev` branch)
- prod (Vercel): hosted Production (tracks the `main` branch)

## One‑time setup
```bash
# ensure branches exist and are tracked
git checkout -B main && git push -u origin main
git checkout -B dev  && git push -u origin dev
```
Vercel project settings:
- Git → Production Branch: `main` (auto‑deploy on push: ON)
- Domains:
  - `collection.ito.com` → connect to Environment: Production
  - `dev.collection.ito.com` → connect to Environment: Preview → Assign to Branch: `dev`
- Environment Variables: set the SAME values in Production and Preview (single Supabase)

## Daily dev loop
```bash
# 1) work locally
npm run dev

# 2) push to preview
git checkout dev
git add -A && git commit -m "feat: ..."
git push origin dev
# → Vercel builds Preview → visit https://dev.collection.ito.com
```

Optional: fast preview deploy from your working tree (skips GitHub build queue)
```bash
vercel              # preview deployment of local tree
# or faster if you already built locally
npm run build && vercel --prebuilt
```

## Preview verification before promoting to production
Run this after you're done with local dev and before you merge `dev → main` to ensure Vercel Preview matches local.

```bash
# 0) ensure local tree is linked to the correct Vercel project
vercel link --yes

# 1) pull Preview env vars and settings locally
vercel pull --yes --environment=preview

# 2) reproduce Vercel's build locally (uses .vercel/project.json and env)
npm ci
npm run lint && npm run typecheck && npm run test
vercel build --yes

# 3) deploy to Preview and verify
git push origin dev             # preferred: triggers Vercel Preview build for the commit
# or deploy your local prebuilt output if needed:
# vercel deploy --prebuilt --yes

# 4) confirm the deployment is healthy
vercel ls | cat                 # find the latest preview URL
vercel inspect <deployment-url> | cat
vercel logs <deployment-url> --since 15m | cat

# 5) manual smoke test at your dev domain (mapped to Preview)
# open: https://dev.collection.ito.com
```

## Promote to production
Preferred (via PR):
```bash
# open PR dev → main in GitHub UI, merge when green
# never commit directly to main; prefer PRs for traceability
```
Direct (CLI merge):
```bash
git checkout main
git pull --ff-only
git merge --no-ff dev
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
