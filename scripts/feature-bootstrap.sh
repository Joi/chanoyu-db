#!/bin/zsh

set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "error: GitHub CLI 'gh' is required" >&2
  exit 1
fi

if [ $# -lt 2 ]; then
  echo "Usage: $0 <slug> <title>" >&2
  exit 1
fi

SLUG="$1"
shift
TITLE="$*"

DATE=$(date +%F)
SPEC_DIR=".agent-os/specs/${DATE}-${SLUG}"
BRANCH="feature/${SLUG}"

git checkout dev >/dev/null 2>&1 || git checkout -B dev
git pull --ff-only || true

git checkout -b "$BRANCH" || git checkout "$BRANCH"

mkdir -p "$SPEC_DIR"
if [ ! -f "$SPEC_DIR/spec.md" ]; then
  cat > "$SPEC_DIR/spec.md" <<EOF
# Spec Requirements Document

> Spec: ${TITLE}
> Created: ${DATE}

## Overview

TBD.

## User Stories

TBD.

## Spec Scope

TBD.

## Out of Scope

TBD.

## Expected Deliverable

TBD.
EOF
fi

git add "$SPEC_DIR/spec.md"
git commit -m "chore(spec): bootstrap ${SLUG} spec folder" || true

# Create Issue
ISSUE_URL=$(gh issue create \
  --title "[Spec] ${TITLE}" \
  --body "Spec lives at \



${SPEC_DIR}/spec.md

Please track work in GitHub Issues labeled \`feature:${SLUG}\`." \
  --label "type:docs,area:workflow,feature:${SLUG},state:needs-spec" \
  --json url --jq .url)

echo "Created issue: ${ISSUE_URL}"

# Create draft PR
gh pr create \
  --base dev \
  --head "$BRANCH" \
  --title "feat(${SLUG}): ${TITLE}" \
  --body "Draft PR for ${TITLE}.\n\nSpec: ${ISSUE_URL}\n" \
  --draft || true

echo "Bootstrap complete for ${SLUG}" 

