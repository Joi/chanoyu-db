# Technical Stack

- application_framework: Next.js 14 (App Router)
- database_system: Supabase (Postgres with RLS)
- javascript_framework: React 18 (Server Components + Client islands)
- import_strategy: node
- css_framework: Tailwind CSS
- ui_component_library: Custom (Tailwind-based)
- fonts_provider: System + CSS
- icon_library: n/a
- application_hosting: Vercel
- database_hosting: Supabase Cloud
- asset_hosting: Supabase Storage (public bucket: media)
- deployment_solution: Vercel (Preview on dev, Production on main)
- code_repository_url: https://github.com/Joi/chanoyu-db
- node_package_manager: pnpm
- python_version_control: venv
- ts_test_runner: Vitest (jsdom)
- ts_test_libs: @testing-library/react, @testing-library/dom
- ts_test_paths: tests/*.test.ts, tests/*.test.tsx, app/**/[name].test.tsx
- python_test_runner: pytest
- python_test_paths: tests/test_*.py (configured via pytest.ini)
- ci_cd_provider: GitHub Actions
- ci_workflows: .github/workflows/ci.yml (main), .github/workflows/vercel-preview.yml (dev)
- preview_builds: Vercel CLI build on push to dev (vercel-preview.yml)
- production_deploy: Vercel Git integration on pushes to main (auto-deploy)
- github_cli: gh

## Pull Request workflow

- GitHub UI:
  1) Push changes to `dev`.
  2) Open Compare page: https://github.com/Joi/chanoyu-db/compare/main...dev?quick_pull=1
  3) Fill title/body, create PR, ensure CI passes, then merge.

- gh CLI:
  1) `git checkout -B dev && git push -u origin dev`
  2) `gh pr create --base main --head dev --title "<title>" --body "<body>"`
  3) Optional: `gh pr view --web` to open in browser; `gh pr merge --merge` when green.
