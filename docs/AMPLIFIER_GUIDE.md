# Amplifier Tools Guide for Chanoyu-DB

## Overview

Amplifier tools are AI-powered development accelerators that understand the specific patterns and conventions of the Chanoyu-DB project. They help reduce boilerplate code, generate tests, and speed up development while maintaining consistency with our architecture and design system.

## Why Amplifier?

1. **Project-Specific Intelligence**: Tools are trained on our codebase patterns
2. **Consistency**: Generated code follows our conventions automatically
3. **Speed**: Reduce time spent on repetitive tasks
4. **Quality**: AI-generated tests catch edge cases you might miss
5. **Documentation**: Tools can generate comprehensive docs from code

## Setup

### One-Time Installation

```bash
# Install amplifier tools
make tools-setup

# Verify installation
amplifier --version
```

### Configuration

The tools are pre-configured for Chanoyu-DB. Configuration lives in:
- `/tools/config.yaml` - Tool settings
- `/tools/templates/` - Code generation templates
- `/tools/patterns/` - Project-specific patterns

## Available Tools

### 1. Test Generator

Generate comprehensive tests for React components:

```bash
# Generate tests for a component
make generate-test COMPONENT=app/components/FormCard.tsx

# Generate tests with specific scenarios
make generate-test COMPONENT=app/admin/objects/page.tsx SCENARIOS="edit,create,delete"

# Generate integration tests
make generate-test-integration FLOW="user-login-to-object-edit"
```

### 2. Component Generator

Create new components following our design system:

```bash
# Create a new component with TypeScript and tests
amplifier generate component MyNewComponent --with-tests

# Create a bilingual component
amplifier generate bilingual-component MyBilingualCard

# Create an admin form component
amplifier generate admin-form ObjectForm --fields="title,description,category"
```

### 3. Database Migration Helper

Generate Supabase migrations with RLS policies:

```bash
# Generate a migration for a new table
amplifier generate migration create-tea-schools

# Generate RLS policies for a table
amplifier generate rls-policies tea_schools --roles="anon,authenticated,admin"

# Generate TypeScript types from schema
amplifier generate types --from-schema
```

### 4. Documentation Generator

Generate documentation from code:

```bash
# Generate API documentation
amplifier generate docs api

# Generate component documentation
amplifier generate docs components

# Generate full project documentation
amplifier generate docs all
```

### 5. Code Reviewer

AI-powered code review:

```bash
# Review changes in current branch
amplifier review

# Review specific files
amplifier review app/components/FormCard.tsx

# Review with specific focus
amplifier review --focus="security,performance,accessibility"
```

## Tea Ceremony Design System Integration

Amplifier tools are aware of our Tea Ceremony Design System and will:

- Use appropriate color tokens (shibui, wabi, yugen, matcha)
- Apply ma-based spacing
- Generate bilingual components by default
- Follow our typography guidelines

### Example: Generating a Tea Ceremony Component

```bash
amplifier generate component TeaBowlCard --design-system=tea-ceremony

# This generates:
# - Component using our color tokens
# - Ma-based spacing classes
# - Bilingual label support
# - Proper TypeScript types
# - Tests following our patterns
```

## Workflow Integration

### Feature Development Workflow

1. **Create GitHub Issue**
   ```bash
   gh issue create --title "Add tea school management" --label "type:feature"
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/tea-school-management-42
   ```

3. **Generate initial structure with amplifier**
   ```bash
   # Generate database migration
   amplifier generate migration create-tea-schools

   # Generate API route
   amplifier generate api tea-schools --crud

   # Generate admin UI
   amplifier generate admin-page tea-schools

   # Generate tests
   make generate-test COMPONENT=app/admin/tea-schools/page.tsx
   ```

4. **Review and customize generated code**
   ```bash
   # AI review before committing
   amplifier review
   ```

5. **Test locally**
   ```bash
   pnpm dev
   pnpm test
   ```

6. **Create PR**
   ```bash
   gh pr create --base main
   ```

### Maintenance Workflow

When updating existing components:

```bash
# Generate missing tests for existing component
make generate-test COMPONENT=app/components/ObjectCard.tsx

# Update component to new design system
amplifier migrate component ObjectCard --to-design-system=v1.5

# Generate documentation for changes
amplifier generate docs components/ObjectCard
```

## Best Practices

### 1. Always Review Generated Code

- AI-generated code is a starting point
- Review for business logic correctness
- Ensure it matches your specific requirements
- Customize as needed

### 2. Use Tools for Repetitive Tasks

Good use cases:
- Boilerplate generation
- Test creation
- Documentation
- Type generation from database

Not ideal for:
- Complex business logic
- Custom algorithms
- Security-critical code (review extra carefully)

### 3. Maintain Tool Configuration

Keep tool patterns updated:
```bash
# Update patterns when conventions change
amplifier update-patterns

# Validate patterns still work
amplifier validate-patterns
```

### 4. Combine with Manual Coding

The tools augment, not replace, manual coding:
1. Use tools for initial generation
2. Manually refine business logic
3. Use tools for tests and docs
4. Manual review and optimization

## Troubleshooting

### Common Issues

**Tool not found:**
```bash
# Reinstall tools
make tools-setup --force
```

**Generated code doesn't match patterns:**
```bash
# Update tool patterns
amplifier update-patterns

# Clear tool cache
amplifier cache clear
```

**Tests fail after generation:**
```bash
# Regenerate with debug info
make generate-test COMPONENT=app/components/MyComponent.tsx DEBUG=true

# Check test patterns are current
amplifier validate test-patterns
```

### Getting Help

1. Check tool documentation: `amplifier help [command]`
2. View examples: `amplifier examples [tool]`
3. Report issues: Create GitHub issue with `tool:amplifier` label

## Advanced Usage

### Custom Templates

Create project-specific templates:

```bash
# Create custom component template
amplifier template create my-component-type

# Use custom template
amplifier generate component MyComponent --template=my-component-type
```

### Batch Operations

Process multiple files:

```bash
# Generate tests for all components missing tests
amplifier batch generate-tests --missing-only

# Update all components to new design system
amplifier batch migrate --to-design-system=v1.5

# Review all changes in branch
amplifier batch review --branch=feature/my-feature
```

### CI/CD Integration

Add to GitHub Actions:

```yaml
# .github/workflows/amplifier.yml
name: Amplifier Checks

on: [pull_request]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Amplifier
        run: make tools-setup
      - name: AI Code Review
        run: amplifier review --ci
      - name: Check Test Coverage
        run: amplifier coverage check
```

## Migration from Legacy Patterns

### From .agent-os to Amplifier

If you have existing `.agent-os/specs/`:

```bash
# Migrate existing specs to amplifier format
amplifier migrate legacy-specs

# Archive old specs
mv .agent-os .agent-os.archive
```

### From Cursor to Claude Code + Amplifier

1. **Continue using Cursor** if you prefer (both work)
2. **Or switch to Claude Code**:
   - Open project in Claude Code
   - Reference `CLAUDE.md` for context
   - Use amplifier tools for generation

## Comparison with Other AI Tools

| Feature | Amplifier | Cursor | GitHub Copilot | ChatGPT |
|---------|-----------|--------|----------------|---------|
| Project-specific patterns | ✅ | Partial | ❌ | ❌ |
| Tea ceremony design system | ✅ | ❌ | ❌ | ❌ |
| Batch operations | ✅ | ❌ | ❌ | ❌ |
| Component generation | ✅ | ❌ | Partial | Manual |
| Test generation | ✅ | Partial | Partial | Manual |
| Integrated workflow | ✅ | Partial | Partial | ❌ |

## Philosophy

Amplifier tools follow the project's philosophy:

- **Simplicity First**: Generated code is clean and readable
- **Convention over Configuration**: Follow established patterns
- **AI as Assistant**: Tools augment human developers, not replace them
- **Quality over Quantity**: Better to generate less code that's correct

## Future Roadmap

Planned enhancements:

- [ ] Visual component preview generation
- [ ] Automatic PR description generation
- [ ] Design system compliance checking
- [ ] Performance optimization suggestions
- [ ] Accessibility audit automation
- [ ] Japanese language support in tools

---

Remember: Amplifier tools are here to accelerate development, not replace thoughtful engineering. Use them wisely to boost productivity while maintaining code quality and project consistency.