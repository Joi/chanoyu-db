# Cursor Configuration for Chanoyu-DB

## Quick Setup

Since Cursor doesn't automatically pin files from config, here's the best way to set up your workspace:

### 1. First Time Setup

Run this command to open all key files:
```bash
chmod +x setup-cursor.sh
./setup-cursor.sh
```

Then manually pin each tab by right-clicking and selecting "Pin Tab".

### 2. Key Files to Keep Open

Always have these files open and pinned:
- **CLAUDE.md** - AI collaboration guidelines
- **TASKS.md** - Current work items  
- **README.md** - Project overview
- **docs/ARCHITECTURE.md** - System design

### 3. Using Cursor's AI (Cmd+K or Cmd+L)

The AI will automatically use `.cursorrules` for context. You can also:

**Include specific files in your prompt:**
```
@CLAUDE.md @TASKS.md 
How do I implement the next task in the TODO list?
```

**Reference codebase:**
```
@codebase 
Following the patterns in /app, create a new page for tea schools
```

### 4. Cursor Composer (Cmd+I)

When using Composer for multi-file edits:
1. First mention: "Check TASKS.md for current work"
2. Then describe what you need
3. Composer will follow the rules in `.cursorrules`

### 5. Chat Context

To add files to the chat context:
1. Click the "+" button in the chat
2. Add these files:
   - CLAUDE.md
   - Current file you're working on
   - Related files from /app or /lib

## Team Collaboration Tips

### For the New Developer

1. **First day:**
   - Run `./setup-cursor.sh` 
   - Pin the opened files
   - Read CONTRIBUTING.md

2. **Starting a task:**
   - Check TASKS.md
   - Ask Cursor: "@TASKS.md what files are related to [task name]?"

3. **Before committing:**
   - Run: `pnpm typecheck`
   - Check the preview site

### For You (Project Lead)

1. **Update TASKS.md** regularly
2. **Add notes** in CLAUDE.md when you discover patterns
3. **Review PRs** with Cursor's diff view

## Cursor Settings Recommendations

Go to Cursor Settings (Cmd+,) and set:

1. **Model**: Claude 3.5 Sonnet for best results
2. **Rules**: Will use `.cursorrules` automatically
3. **Context Length**: Set to maximum
4. **Include Definitions**: On

## Useful Cursor Commands

- `Cmd+K` - Quick AI edits
- `Cmd+L` - Open chat
- `Cmd+I` - Composer (multi-file)
- `@codebase` - Reference entire project
- `@file` - Reference specific files
- `@docs` - Reference documentation

## Troubleshooting

**If Cursor AI seems confused:**
1. Clear the chat
2. Start with: "Read CLAUDE.md and TASKS.md first"
3. Then ask your question

**If wrong patterns are suggested:**
1. Point to specific example: "@/app/chakai/page.tsx follow this pattern"
2. Mention: "Check .cursorrules for project standards"

**For complex changes:**
1. Break into smaller tasks
2. Update TASKS.md 
3. Work on one file at a time
