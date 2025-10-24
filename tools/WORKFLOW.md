# Amplifier + Agent-OS Workflow Guide

This document explains how to use amplifier tools within your existing agent-os development process.

## Overview

**Agent-OS:** Manages your development workflow (specs → tasks → execution → PR)
**Amplifier:** Provides AI-powered tools you use DURING task execution

They work together, not as replacements.

## Complete Feature Development Flow

### Phase 1: Planning (Agent-OS)

```bash
# 1. Create GitHub Issue for the feature
# Example: "Add IIIF Presentation v3 manifest support"

# 2. Create spec using agent-os
# This creates:
# - .agent-os/specs/2025-10-24-iiif-manifests/spec.md
# - .agent-os/specs/2025-10-24-iiif-manifests/tasks.md
# - .agent-os/specs/2025-10-24-iiif-manifests/sub-specs/technical-spec.md
```

### Phase 2: Task Execution (Agent-OS + Amplifier)

**This is where amplifier tools come in!**

For each task in your tasks.md:

#### Option A: Test-First Development (Recommended for New Components)

```bash
# Task: "Create IIIF manifest generator"

# Step 1: Design the interface first (with Claude Code)
# Talk through what the component should do

# Step 2: Generate test BEFORE writing code
make generate-test COMPONENT=lib/iiif/manifest-generator.ts

# Step 3: Review and adjust the generated test
# Edit tests/iiif/manifest-generator.test.ts

# Step 4: Write code to make tests pass
# Implement lib/iiif/manifest-generator.ts

# Step 5: Run tests
pnpm test tests/iiif/manifest-generator.test.ts
```

#### Option B: Code-First (For Quick Iterations)

```bash
# Task: "Add thumbnail support to galleries"

# Step 1: Write the code
# Implement the feature

# Step 2: Generate tests for what you wrote
make generate-test COMPONENT=app/components/IIIFGallery.tsx

# Step 3: Review tests and run them
pnpm test tests/components/IIIFGallery.test.tsx
```

#### Option C: Use Claude Code with Amplifier Context

```bash
# Task: "Integrate IIIF Image API"

# Talk to Claude Code:
"I'm implementing IIIF Image API integration for chanoyu-db.

Context:
- Spec: @.agent-os/specs/2025-10-24-iiif-manifests/spec.md
- Technical approach: @.agent-os/specs/2025-10-24-iiif-manifests/sub-specs/technical-spec.md
- Existing image handling: lib/media.ts

Help me design the integration."

# Then use amplifier tools as needed:
make generate-test COMPONENT=lib/iiif/image-api.ts
```

### Phase 3: Testing & Refinement

```bash
# Run all tests (including amplifier-generated)
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint

# Fix issues, iterate
```

### Phase 4: Completion (Agent-OS)

```bash
# Agent-OS handles:
# - Git commit and push
# - PR creation
# - Recap document
# - Roadmap update
# - Issue closure
```

## When to Use Amplifier Tools

### Always Use For:

1. **Test Generation**
   ```bash
   make generate-test COMPONENT=<path>
   ```
   - New components/functions
   - Edge cases you might miss
   - Boilerplate reduction

2. **Planning Complex Features**
   - Use Claude Code to think through design
   - Reference your specs
   - Validate against existing code

### Consider Using For:

3. **Documentation** (when that tool exists)
   ```bash
   make generate-docs TARGET=app/api/
   ```

4. **Schema Analysis** (when that tool exists)
   ```bash
   make analyze-schema
   ```

### Don't Use For:

- Simple file changes (just edit them)
- Tiny bug fixes
- Configuration updates
- When you know exactly what to write

## Example: Complete Feature Using Both Systems

### Feature: Add Provenance Timeline

**1. Agent-OS: Create Spec**

```bash
# GitHub Issue: "Add provenance timeline visualization"
# Spec folder: .agent-os/specs/2025-10-24-provenance-timeline/
```

**2. Agent-OS: Create Tasks**

```markdown
## tasks.md

### Phase 1: Data Model
- [ ] Design provenance events schema
- [ ] Create migration with RLS policies
- [ ] Add TypeScript types

### Phase 2: API Layer
- [ ] Create provenance API routes
- [ ] Add event CRUD operations
- [ ] Generate API tests

### Phase 3: UI Components
- [ ] Create TimelineEvent component
- [ ] Create ProvenanceTimeline component
- [ ] Generate component tests

### Phase 4: Integration
- [ ] Add timeline to object page
- [ ] Add timeline to admin page
- [ ] End-to-end testing
```

**3. Execute Phase 1 (WITH Amplifier)**

```bash
# Design schema using Claude Code
# Ask: "Design provenance events schema for chanoyu-db"

# Create migration file
# supabase/migrations/20251024_add_provenance.sql

# Generate tests
make generate-test COMPONENT=lib/types/provenance.ts
```

**4. Execute Phase 2 (WITH Amplifier)**

```bash
# Write API routes
# app/api/provenance/route.ts

# Generate tests for API
make generate-test COMPONENT=app/api/provenance/route.ts

# Run tests
pnpm test tests/api/provenance
```

**5. Execute Phase 3 (WITH Amplifier)**

```bash
# Create TimelineEvent component
# app/components/provenance/TimelineEvent.tsx

# Generate test immediately
make generate-test COMPONENT=app/components/provenance/TimelineEvent.tsx

# Review test, adjust, run
pnpm test tests/components/provenance/TimelineEvent.test.tsx

# Iterate on component until tests pass
```

**6. Agent-OS: Complete**

```bash
# Run full test suite
pnpm test

# Agent-OS handles PR, recap, etc.
```

## Best Practices

### Test Generation Timing

**Generate tests EARLY:**
- ✅ Right after designing the interface
- ✅ Immediately after writing the component
- ✅ When adding new functionality

**Don't wait until:**
- ❌ End of the feature
- ❌ PR review time
- ❌ After bugs appear

### Amplifier Tools as First Draft

Think of amplifier-generated code as a **starting point**:

1. **Generate** - Use the tool
2. **Review** - Read what it created
3. **Adjust** - Fix for your specific needs
4. **Learn** - Improve the prompt template if needed

### Customizing Prompts

If generated tests don't match your style:

```bash
# Edit the prompt template
vim tools/prompts/test_generation.md

# Add your preferences
# Examples:
# - "Always mock Supabase with vi.mock()"
# - "Use data-testid for selectors"
# - "Include accessibility tests"

# Next generation will follow your style
```

## Integration with Agent-OS Instructions

### Update Your execute-task.md

Add amplifier tools to your task execution flow:

```markdown
## Task Execution Process

1. **Understand task** - Read acceptance criteria
2. **Design approach** - Use Claude Code to plan
3. **Generate tests** - `make generate-test` for new components
4. **Implement code** - Write the feature
5. **Run tests** - Verify implementation
6. **Iterate** - Fix issues, refine
```

### Update Your Specs

Include amplifier tool usage in technical-spec.md:

```markdown
## Implementation Approach

### Testing Strategy
- Generate initial test suites using amplifier tools
- Review and customize generated tests
- Add edge cases manually
- Target 80%+ coverage
```

## Troubleshooting

### "Amplifier test doesn't match my needs"

**Solution:** Edit the prompt template

```bash
vim tools/prompts/test_generation.md
# Add specific requirements
# Next generation will be better
```

### "I don't know when to use amplifier"

**Rule of thumb:**
- **Creating something new?** → Use amplifier
- **Fixing something existing?** → Your choice
- **Repetitive task?** → Use amplifier

### "Generated code has errors"

**That's normal!** Amplifier gives you a starting point:

1. Review the generated code
2. Fix issues (types, imports, logic)
3. Run tests
4. Iterate

It's faster than writing from scratch.

## Summary

### Agent-OS Manages:
- ✅ Workflow (spec → tasks → execution → PR)
- ✅ Git branches and commits
- ✅ GitHub issue tracking
- ✅ Recaps and documentation
- ✅ Process consistency

### Amplifier Provides:
- ✅ Test generation
- ✅ Code analysis
- ✅ Boilerplate reduction
- ✅ AI assistance during implementation
- ✅ Development acceleration

### You Control:
- ✅ When to use each tool
- ✅ What code to keep/modify
- ✅ Final quality and decisions
- ✅ Feature design and architecture

**The combination gives you structured process (agent-os) with AI acceleration (amplifier).**
