# Development Best Practices

## Context

Global development guidelines for Agent OS projects.

<conditional-block context-check="core-principles">
IF this Core Principles section already read in current context:
  SKIP: Re-reading this section
  NOTE: "Using Core Principles already in context"
ELSE:
  READ: The following principles

## Core Principles

### Keep It Simple
- Implement code in the fewest lines possible
- Avoid over-engineering solutions
- Choose straightforward approaches over clever ones

### Optimize for Readability
- Prioritize code clarity over micro-optimizations
- Write self-documenting code with clear variable names
- Add comments for "why" not "what"

### DRY (Don't Repeat Yourself)
- Extract repeated business logic to private methods
- Extract repeated UI markup to reusable components
- Create utility functions for common operations

### File Structure
- Keep files focused on a single responsibility
- Group related functionality together
- Use consistent naming conventions
</conditional-block>

<conditional-block context-check="dependencies" task-condition="choosing-external-library">
IF current task involves choosing an external library:
  IF Dependencies section already read in current context:
    SKIP: Re-reading this section
    NOTE: "Using Dependencies guidelines already in context"
  ELSE:
    READ: The following guidelines
ELSE:
  SKIP: Dependencies section not relevant to current task

## Dependencies

### Choose Libraries Wisely
When adding third-party dependencies:
- Select the most popular and actively maintained option
- Check the library's GitHub repository for:
  - Recent commits (within last 6 months)
  - Active issue resolution
  - Number of stars/downloads
  - Clear documentation
</conditional-block>

## Pull Request authoring (gh CLI)

- Prefer a body file (reliable multi-line formatting):

```bash
cat > /tmp/pr_body.md <<'EOF'
This PR adds product documentation and developer workflow updates:

- Item 1
- Item 2

No code changes to runtime behavior.
EOF

gh pr create --base main --head dev \
  --title "feat: concise title" \
  --body-file /tmp/pr_body.md
```

- Quick: use $'...' quoting (interprets \n):

```bash
gh pr create --base main --head dev \
  --title "feat: concise title" \
  --body $'Line 1\n\n- bullet\n- bullet\n\nFooter'
```

- Or with printf:

```bash
gh pr create --title "feat: concise title" \
  --body "$(printf 'Line 1\n\nLine 2\n- bullet')"
```

- Update existing PR body:

```bash
gh pr edit <number> --body-file /tmp/pr_body.md
```
