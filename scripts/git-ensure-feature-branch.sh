#!/bin/zsh

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <slug>" >&2
  exit 1
fi

SLUG="$1"
BRANCH="feature/${SLUG}"

# Auto-stash local changes if present to avoid checkout failures
AUTO_STASH_REF=""
if ! git diff --quiet || ! git diff --cached --quiet; then
  STASH_NAME="agent-os-auto-stash-$(date +%s)"
  git stash push -u -m "$STASH_NAME" >/dev/null
  AUTO_STASH_REF=$(git stash list | grep "$STASH_NAME" | head -n1 | cut -d: -f1)
  echo "Temporarily stashed local changes as $AUTO_STASH_REF"
fi

# Ensure dev exists locally and is up to date
git fetch --all --prune
if ! git show-ref --verify --quiet refs/heads/dev; then
  git checkout -B dev origin/dev || git checkout -B dev
else
  git checkout dev
  git pull --ff-only || true
fi

# Create or switch to feature branch
if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
  git checkout "${BRANCH}"
else
  git checkout -b "${BRANCH}" dev
fi

# Set upstream if not set
if ! git rev-parse --abbrev-ref --symbolic-full-name @{u} >/dev/null 2>&1; then
  git push -u origin "${BRANCH}" || true
fi

# Re-apply stashed changes if we created one
if [ -n "$AUTO_STASH_REF" ]; then
  if git stash apply "$AUTO_STASH_REF" >/dev/null 2>&1; then
    # Drop only if cleanly applied
    git stash drop "$AUTO_STASH_REF" >/dev/null 2>&1 || true
    echo "Re-applied stashed changes."
  else
    echo "Stash applied with conflicts. Please resolve and commit. Stash entry preserved: $AUTO_STASH_REF"
  fi
fi

echo "On branch ${BRANCH}"


