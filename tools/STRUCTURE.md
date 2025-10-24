# Amplifier Tools Structure

Visual reference for the amplifier tools integration in chanoyu-db.

## Directory Structure

```
chanoyu-db/
├── app/                          # Your Next.js application
├── lib/                          # Shared utilities
├── scripts/                      # Existing Python scripts
├── tests/                        # Test files
│   └── (generated tests go here)
├── tools/                        # 🆕 Amplifier Tools
│   ├── README.md                 # Philosophy & usage
│   ├── SETUP.md                  # Quick start guide
│   ├── STRUCTURE.md              # This file
│   ├── requirements.txt          # Python dependencies
│   │
│   ├── utils/                    # Shared utilities
│   │   ├── __init__.py
│   │   └── claude_helpers.py     # Claude API wrapper
│   │
│   ├── prompts/                  # Prompt templates
│   │   └── test_generation.md   # Test generation prompt
│   │
│   └── generate_test.py          # Test generator tool
│
├── .venv/                        # Existing Python venv
├── .venv-tools/                  # 🆕 Tools Python venv (gitignored)
├── .env.local                    # Secrets (add ANTHROPIC_API_KEY)
├── Makefile                      # Build commands (updated)
└── package.json                  # Node dependencies
```

## Tool Architecture

```
┌─────────────────────────────────────────────────────┐
│                    User                             │
└──────────────────────┬──────────────────────────────┘
                       │
                       │ make generate-test COMPONENT=...
                       ▼
┌─────────────────────────────────────────────────────┐
│                  Makefile                           │
│  - Activates .venv-tools                           │
│  - Calls Python script                             │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│            tools/generate_test.py                   │
│  1. Read component file                            │
│  2. Load prompt template                           │
│  3. Call Claude via helper                         │
│  4. Write test file                                │
└─────────┬──────────────────────┬────────────────────┘
          │                      │
          │                      │
          ▼                      ▼
┌──────────────────┐   ┌───────────────────────┐
│ utils/           │   │ prompts/              │
│ claude_helpers   │   │ test_generation.md    │
│                  │   │                       │
│ - ask_claude()   │   │ Template with         │
│ - read_file()    │   │ instructions for      │
│ - write_file()   │   │ Claude                │
└────────┬─────────┘   └───────────────────────┘
         │
         │ API call
         ▼
┌─────────────────────────────────────────────────────┐
│              Claude API                             │
│  - Analyzes component                              │
│  - Generates test code                             │
└──────────────────────┬──────────────────────────────┘
                       │
                       │ Returns test code
                       ▼
┌─────────────────────────────────────────────────────┐
│           tests/admin/objects/page.test.tsx         │
│  Generated test file (ready to run)                │
└─────────────────────────────────────────────────────┘
```

## Data Flow

1. **Input**: React component file (`app/admin/objects/page.tsx`)
2. **Processing**:
   - Read component source code
   - Load prompt template
   - Substitute component code into template
   - Send to Claude API
3. **Output**: Test file (`tests/admin/objects/page.test.tsx`)

## Key Components

### 1. Makefile Commands

```makefile
make tools-setup          # One-time: create Python venv
make generate-test        # Generate test for component
```

### 2. Python Utilities

**`utils/claude_helpers.py`** provides:
- `ask_claude()` - Send prompts to Claude
- `read_file()` - Safe file reading
- `write_file()` - Safe file writing
- `load_prompt_template()` - Load & substitute templates

### 3. Prompt Templates

**`prompts/test_generation.md`** contains:
- Instructions for Claude
- Requirements for test format
- Code style guidelines
- Example structure

### 4. Tool Scripts

**`generate_test.py`** flow:
1. Parse command-line arguments
2. Read component file
3. Generate test using Claude
4. Write test file to tests/ directory
5. Print success message with next steps

## Environment Setup

### Python Virtual Environments

```
.venv/          # Existing venv for app scripts (Notion, Sheets)
.venv-tools/    # New venv for amplifier tools
```

**Why separate?**
- Different dependencies
- Tools don't interfere with app
- Can upgrade independently

### Environment Variables

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...    # For Claude API access
```

## Adding New Tools

Follow this pattern:

```
1. Create script:     tools/new_tool.py
2. Create prompt:     tools/prompts/new_tool.md
3. Add Makefile cmd:  Makefile (new-tool target)
4. Document:          tools/README.md
```

Example:
```bash
# tools/generate_docs.py
# tools/prompts/docs_generation.md
# make generate-docs TARGET=app/api/
```

## Integration Points

### With Existing Project

- ✅ **Doesn't modify** existing app code
- ✅ **Separate venv** from existing Python scripts
- ✅ **Generates files** in existing test directories
- ✅ **Uses existing** Makefile pattern
- ✅ **Gitignored** venv and secrets

### With Version Control

```bash
# Committed (part of the project)
tools/
├── README.md
├── SETUP.md
├── requirements.txt
├── utils/
├── prompts/
└── *.py

# Gitignored (local only)
.venv-tools/         # Python venv
.env.local           # API keys
__pycache__/         # Python cache
```

## Benefits

1. **Reusable** - Run the same tool many times
2. **Versioned** - Tools evolve with the project
3. **Documented** - Clear instructions for team
4. **Isolated** - Separate Python environment
5. **Simple** - Make commands hide complexity
6. **Extensible** - Easy to add new tools

## Philosophy

**Code for structure, AI for intelligence**

- Python handles file I/O, iteration, error handling
- Claude handles understanding code, generating tests
- Best of both worlds: reliability + intelligence
