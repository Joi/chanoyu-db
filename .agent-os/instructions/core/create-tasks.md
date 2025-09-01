---
description: Create an Agent OS tasks list from an approved feature spec
globs:
alwaysApply: false
version: 1.1
encoding: UTF-8
---

# Spec Creation Rules

## Overview

With the user's approval, proceed to creating a tasks list based on the current feature spec.

<pre_flight_check>
  EXECUTE: @.agent-os/instructions/meta/pre-flight.md
</pre_flight_check>

<process_flow>

<step number="0" subagent="gh-cli" name="update_current_issue_with_tasks">

### Step 0: Update Current Issue With Tasks (when invoked from an Issue)

If this command is executed from within a GitHub Issue (issue body contains the trigger or an issue comment invoked it), write a checklist of tasks directly into the Issue body so it's human‑readable.

<task_writeback_rules>
  - Use a Markdown section titled `## Tasks`
  - Use GitHub checkboxes `- [ ]` for each task
  - Preserve any existing body content above; append or replace only the `## Tasks` section
  - Ensure proper newlines by using a body file (`--body-file`)
</task_writeback_rules>

<automation_example>
  ```bash
  # Derive issue number from the GitHub Actions event (fallback: no-op)
  ISSUE_NUMBER=$(jq -r '.issue.number // empty' "$GITHUB_EVENT_PATH" 2>/dev/null || true)
  if [ -n "$ISSUE_NUMBER" ]; then
    tmpdir=$(mktemp -d)
    prev="$tmpdir/prev.md"
    tasks="$tmpdir/tasks.md"
    merged="$tmpdir/merged.md"

    # Fetch existing body
    gh issue view "$ISSUE_NUMBER" --json body --jq .body > "$prev"

    # Generate tasks list here (example placeholder)
    cat > "$tasks" <<'EOF'
## Tasks
- [ ] Define acceptance criteria
- [ ] Implement feature
- [ ] Write tests
- [ ] Update docs
EOF

    # If a Tasks section exists, replace it; else append
    if grep -q '^## Tasks' "$prev"; then
      awk 'BEGIN{p=1} /^## Tasks/{print; p=0} p{print} /^## Tasks/{exit}' "$prev" > "$merged"
      # Simple append of new tasks after the header
      awk 'f;/^## Tasks/{f=1}' "$tasks" >> "$merged"
    else
      cat "$prev" > "$merged"
      printf "\n\n" >> "$merged"
      cat "$tasks" >> "$merged"
    fi

    gh issue edit "$ISSUE_NUMBER" --body-file "$merged"
  fi
  ```
</automation_example>

</step>

<step number="0a" subagent="git-workflow" name="optional_branch_creation">

### Step 0a: Create/Switch to a Feature Branch (on request)

If the user says "create a new branch to do this" (or explicitly requests a branch now), create or switch to `feature/<slug>` before creating issues.

<how_to_derive_slug>
  Prefer one of:
  - From Issue labels: `feature:<slug>`
  - From latest spec folder name `.agent-os/specs/YYYY-MM-DD-<slug>/` (strip date)
</how_to_derive_slug>

<automation_example>
  ```bash
  # Try to derive slug from the invoking Issue labels
  ISSUE_NUMBER=$(jq -r '.issue.number // empty' "$GITHUB_EVENT_PATH" 2>/dev/null || true)
  if [ -n "$ISSUE_NUMBER" ]; then
    SLUG=$(gh issue view "$ISSUE_NUMBER" --json labels --jq '.labels[].name | select(startswith("feature:")) | sub("^feature:";"")' | head -n1)
  fi

  # Fallback: derive from latest spec directory
  if [ -z "${SLUG:-}" ]; then
    SLUG=$(ls -1d .agent-os/specs/*/ 2>/dev/null | sed -E 's#.*/[0-9]{4}-[0-9]{2}-[0-9]{2}-##; s#/$##' | tail -n1)
  fi

  if [ -n "${SLUG:-}" ]; then
    chmod +x scripts/git-ensure-feature-branch.sh || true
    ./scripts/git-ensure-feature-branch.sh "$SLUG"
  fi
  ```
</automation_example>

</step>

<step number="1" subagent="gh-cli" name="create_github_issues">

### Step 1: Create GitHub Issues (replace local tasks.md)

Create a small set of GitHub Issues derived from the approved spec. Prefer 1-5 issues grouped by deliverable/component. Use labels and optional milestone.

<issue_guidelines>
  <labels>
    - type:feature | type:bug | type:chore | type:docs
    - area:frontend | area:api | area:db | area:admin | area:media | area:workflow | area:docs
    - priority:P0 | priority:P1 | priority:P2
    - state:ready | state:blocked | state:needs-spec
    - feature:<slug>
  </labels>
  <milestone>
    - optional: Feature: <Short Name>
  </milestone>
  <body_template>
    - Link the spec: .agent-os/specs/YYYY-MM-DD-slug/spec.md
    - Brief acceptance criteria
    - Testing notes (if any)
  </body_template>
</issue_guidelines>

<automation_minimal>
  Prefer manual creation in GitHub UI or use gh CLI with a body file to ensure proper newlines:
  cat > /tmp/issue_body.md <<'EOF'
  See .agent-os/specs/YYYY-MM-DD-slug/spec.md

  Acceptance Criteria:
  - [ ] Criteria 1
  - [ ] Criteria 2

  Testing Notes:
  - Note 1
  EOF

  gh issue create --title "[Feature] Short task title" \
                  --body-file /tmp/issue_body.md \
                  --label "type:feature,area:workflow,feature:slug,state:ready" \
                  --milestone "Feature: Short Name"
</automation_minimal>

</step>

<step number="2" name="execution_readiness">

### Step 2: Execution Readiness Check

Evaluate readiness by presenting the first ready Issue and requesting confirmation to proceed.

<readiness_summary>
  <present_to_user>
    - Spec name and description
    - First "state:ready" issue title and labels
    - Estimated complexity/scope
    - Key deliverables for this issue
  </present_to_user>
</readiness_summary>

<execution_prompt>
  PROMPT: "Planning is complete. The first issue is:

  **Issue:** [ISSUE_TITLE] ([ISSUE_NUMBER])
  Labels: [LABELS]

  Proceed with this issue? I'll focus only on it unless you specify otherwise."
</execution_prompt>

<execution_flow>
  IF user_confirms_yes:
    REFERENCE: @.agent-os/instructions/core/execute-tasks.md
    FOCUS: Only the selected Issue
    CONSTRAINT: Do not proceed to additional issues without explicit user request
  ELSE:
    WAIT: For user clarification or modifications
</execution_flow>

</step>

</process_flow>

<post_flight_check>
  EXECUTE: @.agent-os/instructions/meta/post-flight.md
</post_flight_check>
