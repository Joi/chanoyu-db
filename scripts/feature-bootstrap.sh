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

# Create Issue (use temp file for proper multiline Markdown and embed spec)
ISSUE_BODY_FILE=$(mktemp)
{
  cat <<EOF
# [Spec] ${TITLE}

Source: \
\`${SPEC_DIR}/spec.md\`

Labels: \`type:docs\`, \`area:workflow\`, \`feature:${SLUG}\`, \`state:needs-spec\`

---

The following is the current contents of the spec for convenience:

EOF
  cat "${SPEC_DIR}/spec.md"
} > "$ISSUE_BODY_FILE"

ISSUE_URL=$(gh issue create \
  --title "[Spec] ${TITLE}" \
  --body-file "$ISSUE_BODY_FILE" \
  --label "type:docs,area:workflow,feature:${SLUG},state:needs-spec" \
  --json url --jq .url)

rm -f "$ISSUE_BODY_FILE"

echo "Created issue: ${ISSUE_URL}"

# Create draft PR (use body file to ensure newlines render)
PR_BODY_FILE=$(mktemp)
cat > "$PR_BODY_FILE" <<EOF
Draft PR for ${TITLE}.

Spec: ${ISSUE_URL}
EOF

gh pr create \
  --base dev \
  --head "$BRANCH" \
  --title "feat(${SLUG}): ${TITLE}" \
  --body-file "$PR_BODY_FILE" \
  --draft || true

rm -f "$PR_BODY_FILE"

echo "Bootstrap complete for ${SLUG}" 

