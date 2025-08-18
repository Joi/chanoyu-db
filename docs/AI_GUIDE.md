## AI Assistant Guide (Cursor, Claude, Copilot, etc.)

This repo has a mixed TypeScript (Next.js) and Python toolchain. To avoid breaking the environment:

1) Respect package managers
- Node: prefer `pnpm`. Do not switch to npm/yarn without updating lockfiles.
- Python: use `.venv` with `requirements.txt` and `requirements-dev.txt`.

2) Do not hardcode machine-specific paths
- Use environment variables documented in `docs/ENVIRONMENT.md`.
- For Google auth, accept both service accounts and user OAuth tokens. Avoid interactive flows in CI.

3) Keep edits minimal and typed
- For TS: keep strictness, run `pnpm typecheck`.
- For Python: run `pytest` and prefer explicit, readable code.

4) Merging data
- Use `src/merge.py::merge_by_identifier` to join Notion items with Sheets by token and local id.
- Do not change output shapes consumed by downstream scripts unless you also update those scripts.

5) CI expectations
- A green run for: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pytest`.

6) Sensitive files
- Do not commit `.env` or credentials. Use absolute paths in env vars.



