# Amplifier Tools Setup Guide

Quick guide to get the amplifier tools working in your chanoyu-db project.

## One-Time Setup

### 1. Install Python Dependencies

```bash
cd ~/chanoyu-db
make tools-setup
```

This creates a separate Python virtual environment (`.venv-tools`) for the amplifier tools.

### 2. Set Your API Key

Add to your `.env.local` file:

```bash
ANTHROPIC_API_KEY=your_claude_api_key_here
```

Get your API key from: https://console.anthropic.com/

### 3. Test the Installation

```bash
# Activate the tools environment
source .venv-tools/bin/activate

# Check Python and dependencies
python --version  # Should be Python 3.x
pip list          # Should show anthropic, python-dotenv

# Deactivate when done
deactivate
```

## Using the Tools

### Generate a Test

```bash
cd ~/chanoyu-db
make generate-test COMPONENT=app/admin/objects/page.tsx
```

**What happens:**
1. Reads your React component
2. Sends it to Claude with test generation instructions
3. Generates a comprehensive Vitest test
4. Saves to `tests/admin/objects/page.test.tsx`

**Then:**
```bash
# Review the test
cat tests/admin/objects/page.test.tsx

# Run it
pnpm test tests/admin/objects/page.test.tsx

# Adjust as needed for your specific use case
```

## Common Issues

### "ANTHROPIC_API_KEY not found"

Make sure you added it to `.env.local`:
```bash
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env.local
```

### "Command not found: make"

On macOS, install Xcode Command Line Tools:
```bash
xcode-select --install
```

### ".venv-tools not found"

Run the setup again:
```bash
make tools-setup
```

### "Module not found: anthropic"

Activate the environment and reinstall:
```bash
source .venv-tools/bin/activate
pip install -r tools/requirements.txt
```

## Next Steps

1. **Try generating a test** for one of your components
2. **Review the generated test** - it won't be perfect, but it's a great starting point
3. **Customize the prompt** - Edit `tools/prompts/test_generation.md` to match your style
4. **Create more tools** - Follow the pattern in `generate_test.py`

## Tool Development

Want to create your own amplifier tools? See:
- `tools/README.md` - Overall philosophy and structure
- `tools/generate_test.py` - Example tool implementation
- `tools/utils/claude_helpers.py` - Reusable utilities

The pattern is simple:
1. Create a Python script in `tools/`
2. Use the helper functions to interact with Claude
3. Add a Makefile command for easy access
4. Document it in the README
