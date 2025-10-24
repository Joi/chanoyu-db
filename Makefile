SHELL := /bin/bash

.PHONY: bootstrap node python test typecheck lint merge update-prices

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

update-prices: ## Read sheet, merge with Notion In-Collection items, write merged sheet, update Supabase prices (JPY)
	. .venv/bin/activate && PYTHONPATH=. python3 scripts/update_prices_from_sheet.py

# Amplifier Tools (AI-powered development tools)

.PHONY: tools-setup generate-test

tools-setup: ## Set up amplifier tools Python environment
	python3 -m venv .venv-tools
	. .venv-tools/bin/activate && pip install -r tools/requirements.txt
	@echo "✅ Amplifier tools environment ready"
	@echo "💡 Activate with: source .venv-tools/bin/activate"

generate-test: ## Generate Vitest test for a component (usage: make generate-test COMPONENT=app/admin/objects/page.tsx)
ifndef COMPONENT
	@echo "❌ Error: COMPONENT not specified"
	@echo "Usage: make generate-test COMPONENT=app/admin/objects/page.tsx"
	@exit 1
endif
	@. .venv-tools/bin/activate && python3 tools/generate_test.py $(COMPONENT)


