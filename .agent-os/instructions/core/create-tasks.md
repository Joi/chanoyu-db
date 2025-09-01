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
  Prefer manual creation in GitHub UI or use gh CLI:
  gh issue create --title "[Feature] Short task title" \
                  --body "See .agent-os/specs/YYYY-MM-DD-slug/spec.md" \
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
