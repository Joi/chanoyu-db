# CI for Next.js + TypeScript + SQL

These examples show how to run only the relevant jobs when certain paths change. They assume GitHub Actions but the patterns map to any CI.

## Goals

- Run Node/TypeScript checks when app code changes
- Run SQL checks when database schema changes
- Keep jobs fast and independent; cache dependencies

## Path filters

- Node/TypeScript: `app/**`, `lib/**`, `components/**`, `scripts/**`, `package.json`, `pnpm-lock.yaml`, `tsconfig.json`
- SQL: `supabase/**`

## Example: Combined workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  changes:
    name: Detect changes
    runs-on: ubuntu-latest
    outputs:
      files: ${{ steps.diff.outputs.files }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
      - id: diff
        run: |
          git diff --name-only origin/${{ github.base_ref || 'main' }}...HEAD | jq -Rsc 'split("\n")' > files.json
          echo "files=$(cat files.json)" >> $GITHUB_OUTPUT

  node:
    needs: changes
    env:
      FILES_CHANGED: ${{ needs.changes.outputs.files }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: corepack enable && pnpm i --frozen-lockfile
      - run: pnpm lint && pnpm typecheck && pnpm test --if-present

  sql:
    needs: changes
    env:
      FILES_CHANGED: ${{ needs.changes.outputs.files }}
    steps:
      - uses: actions/checkout@v4
      - name: Lint SQL (simple check)
        run: |
          echo "Listing SQL files changed:" 
          git ls-files supabase/**/*.sql | cat
          # integrate sqlfluff or pgformatter as needed
```

Notes:

- Replace `origin/${{ github.base_ref || 'dev' }}` with a default branch appropriate for your PR target
- Consider adding `sqlfluff` for SQL linting if not already configured
- For more granular triggers, use `on.push.paths` and `on.pull_request.paths` with path globs
