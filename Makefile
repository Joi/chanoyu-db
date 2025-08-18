SHELL := /bin/bash

.PHONY: bootstrap node python test typecheck lint merge

bootstrap: ## Install Node and Python deps
	pnpm i || npm i
	python3 -m venv .venv
	. .venv/bin/activate && pip install -r requirements.txt -r requirements-dev.txt || true

node: ## Node install
	pnpm i || npm i

python: ## Python venv + deps
	python3 -m venv .venv
	. .venv/bin/activate && pip install -r requirements.txt -r requirements-dev.txt || true

test: ## Run TS+Py tests
	( pnpm test || npm run test )
	. .venv/bin/activate && PYTHONPATH=. pytest -q || true

lint: ## Lint TS
	pnpm lint || npm run lint

typecheck: ## TS typecheck
	pnpm typecheck || npm run typecheck

merge: ## Merge Notion + Sheets and dump JSON
	. .venv/bin/activate && python3 run_merge.py


