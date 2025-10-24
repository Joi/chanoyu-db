# Chanoyu-DB Amplifier Tools

This directory contains AI-powered development tools for the chanoyu-db project, built using the amplifier pattern and Claude Code SDK.

## Philosophy

These tools follow the **amplifier pattern**: use code for structure and iteration, use AI (Claude) for intelligence and generation. This gives us the benefits of both:
- **Code**: Reliable file handling, iteration, state management
- **AI**: Understanding context, generating tests/docs, making intelligent decisions

## Directory Structure

```
tools/
├── README.md              # This file
├── requirements.txt       # Python dependencies for tools
├── utils/                 # Shared utilities
│   ├── __init__.py
│   └── claude_helpers.py  # Claude Code SDK helpers
├── prompts/               # Reusable prompt templates
│   └── test_generation.md
├── generate_test.py       # Generate Vitest tests from components
├── generate_docs.py       # Generate API documentation
└── analyze_schema.py      # Analyze database schema
```

## Setup

### Install Dependencies

```bash
cd ~/chanoyu-db
python3 -m venv .venv-tools  # Separate venv for tools
source .venv-tools/bin/activate
pip install -r tools/requirements.txt
```

### Set Environment Variables

Add to your `.env.local`:

```bash
ANTHROPIC_API_KEY=your_api_key_here
```

## Available Tools

### 1. Test Generator

Generate Vitest tests for React components:

```bash
make generate-test COMPONENT=app/admin/objects/page.tsx
```

**What it does:**
- Reads your React component
- Analyzes component structure and props
- Generates comprehensive Vitest test with React Testing Library
- Saves to `tests/` directory

### 2. Documentation Generator (Coming Soon)

Generate API documentation from TypeScript types:

```bash
make generate-docs TARGET=app/api/
```

### 3. Schema Analyzer (Coming Soon)

Analyze database schema and suggest optimizations:

```bash
make analyze-schema
```

## Creating New Tools

Follow the amplifier pattern:

1. **Create Python script** in `tools/`
2. **Add prompt template** in `tools/prompts/`
3. **Use shared utilities** from `tools/utils/`
4. **Add Makefile command** for easy access
5. **Document in this README**

### Example Tool Structure

```python
#!/usr/bin/env python3
"""Tool description"""

import sys
from pathlib import Path
from tools.utils.claude_helpers import ask_claude, read_file

def main():
    # 1. Read input (code handles file I/O)
    input_file = Path(sys.argv[1])
    content = read_file(input_file)

    # 2. Process with Claude (AI handles intelligence)
    result = ask_claude(
        prompt_template="prompts/my_template.md",
        context={"content": content}
    )

    # 3. Write output (code handles file I/O)
    output_file = generate_output_path(input_file)
    output_file.write_text(result)

    print(f"✅ Generated: {output_file}")

if __name__ == "__main__":
    main()
```

## Best Practices

1. **Keep tools focused** - One tool, one job
2. **Use templates** - Store prompts in `prompts/` for reusability
3. **Make it idempotent** - Running twice should be safe
4. **Progress feedback** - Print what's happening
5. **Error handling** - Gracefully handle missing files, API errors
6. **Document usage** - Update this README when adding tools

## Integration with Chanoyu-DB

These tools are **project-specific** and version-controlled with chanoyu-db. They understand:
- Your TypeScript patterns
- Your testing conventions
- Your database schema
- Your Next.js structure

This makes them more effective than generic tools.

## Maintenance

- **Update prompts** as project patterns evolve
- **Keep dependencies minimal** - Only what you actually use
- **Test tools** before committing changes
- **Share improvements** - If a tool helps you, it helps the team
