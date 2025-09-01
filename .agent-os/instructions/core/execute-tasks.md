---
description: Rules to initiate execution of a set of tasks using Agent OS
globs:
alwaysApply: false
version: 1.0
encoding: UTF-8
---

# Task Execution Rules

## Overview

Execute tasks for a given spec following three distinct phases:
1. Pre-execution setup (Steps 1-3)
2. Task execution loop (Step 4)
3. Post-execution tasks (Step 5)

**IMPORTANT**: All three phases MUST be completed. Do not stop after phase 2.

<pre_flight_check>
  EXECUTE: @.agent-os/instructions/meta/pre-flight.md
</pre_flight_check>

<process_flow>

## Phase 1: Pre-Execution Setup

<step number="1" name="task_assignment">

### Step 1: Task Assignment

Identify which GitHub Issue(s) to execute for the spec (using spec reference and optional issue numbers), defaulting to the next open Issue labeled "state:ready" and the feature label for this spec if not specified.

<task_selection>
  <explicit>user specifies exact issue number(s)</explicit>
  <implicit>find next open issue with labels: feature:<slug> AND state:ready</implicit>
</task_selection>

<instructions>
  ACTION: Identify task(s) to execute
  DEFAULT: Select next uncompleted parent task if not specified
  CONFIRM: Task selection with user
</instructions>

</step>

<step number="2" subagent="context-fetcher" name="context_analysis">

### Step 2: Context Analysis

Use the context-fetcher subagent to gather minimal context for task understanding by loading spec files and the selected Issue details. Conditionally load @.agent-os/product/mission-lite.md and sub-specs/technical-spec.md if not already in context.

<instructions>
  ACTION: Use context-fetcher subagent to:
    - REQUEST: "Get product pitch from mission-lite.md"
    - REQUEST: "Get spec summary from spec-lite.md"
    - REQUEST: "Get technical approach from technical-spec.md"
  PROCESS: Returned information
</instructions>


<context_gathering>
  <essential_docs>
    - Issue body and labels
    - spec.md and spec-lite.md
  </essential_docs>
  <conditional_docs>
    - mission-lite.md for product alignment
    - spec-lite.md for feature summary
    - technical-spec.md for implementation details
  </conditional_docs>
</context_gathering>

</step>

<step number="3" subagent="git-workflow" name="git_branch_management">

### Step 3: Git Branch Management

Use the git-workflow subagent to manage git branches to ensure proper isolation by creating or switching to the appropriate feature branch for the spec.

<instructions>
  ACTION: Use git-workflow subagent
  REQUEST: "Check and manage branch for spec: [SPEC_FOLDER]
            - Create branch if needed
            - Switch to correct branch
            - Handle any uncommitted changes"
  WAIT: For branch setup completion
</instructions>

<branch_naming>
  <source>spec folder name</source>
  <format>exclude date prefix</format>
  <example>
    - folder: 2025-03-15-password-reset
    - branch: password-reset
  </example>
</branch_naming>

</step>

## Phase 2: Task Execution Loop

<step number="4" name="task_execution_loop">

### Step 4: Task Execution Loop

**IMPORTANT**: This is a loop. Execute all selected Issues before proceeding to Phase 3.

Execute each selected Issue using @.agent-os/instructions/core/execute-task.md guidance, continuing until all Issues are complete.

<execution_flow>
  LOAD @.agent-os/instructions/core/execute-task.md ONCE

  FOR each issue assigned in Step 1:
    EXECUTE instructions from execute-task.md with:
      - issue_number
      - acceptance criteria from issue body
    WAIT for task completion
    UPDATE issue status/labels and link commits/PR
  END FOR

  **IMPORTANT**: After loop completes, CONTINUE to Phase 3 (Step 5). Do not stop here.
</execution_flow>

<loop_logic>
  <continue_conditions>
    - More unfinished parent tasks exist
    - User has not requested stop
  </continue_conditions>
  <exit_conditions>
    - All assigned tasks marked complete
    - User requests early termination
    - Blocking issue prevents continuation
  </exit_conditions>
</loop_logic>

<task_status_check>
  AFTER each issue execution:
    CHECK for remaining open issues in the feature label
    IF all assigned issues complete:
      PROCEED to next step
    ELSE:
      CONTINUE with next issue
</task_status_check>

<instructions>
  ACTION: Load execute-task.md instructions once at start
  REUSE: Same instructions for each parent task iteration
  LOOP: Through all assigned parent tasks
  UPDATE: Issue status/labels after each completion
  VERIFY: All tasks complete before proceeding
  HANDLE: Blocking issues appropriately
  **IMPORTANT**: When all tasks complete, proceed to Step 5
</instructions>

</step>

## Phase 3: Post-Execution Tasks

<step number="5" name="post_execution_tasks">

### Step 5: Run the task completion steps

**CRITICAL**: This step MUST be executed after all tasks are implemented. Do not end the process without completing this phase.

After all tasks in tasks.md have been implemented, use @.agent-os/instructions/core/post-execution-tasks.md to run our series of steps we always run when finishing and delivering a new feature.

<instructions>
  LOAD: @.agent-os/instructions/core/post-execution-tasks.md once
  ACTION: execute all steps in the post-execution-tasks.md process_flow.
  **IMPORTANT**: This includes:
    - Running full test suite
    - Git workflow (commit, push, PR)
    - Verifying task completion
    - Updating roadmap (if applicable)
    - Creating recap document
    - Generating completion summary
    - Playing notification sound
</instructions>

</step>

</process_flow>

<post_flight_check>
  EXECUTE: @.agent-os/instructions/meta/post-flight.md
</post_flight_check>
