#!/bin/bash

# Cursor Setup Script
# This opens the key files in Cursor for easy access

echo "🍵 Opening key Chanoyu-DB files in Cursor..."

# Open the key documentation files
cursor CLAUDE.md
cursor TASKS.md
cursor README.md
cursor docs/ARCHITECTURE.md
cursor CONTRIBUTING.md
cursor TODO.md

echo "✅ Key files opened!"
echo ""
echo "📌 To pin these files in Cursor:"
echo "1. Right-click on each tab"
echo "2. Select 'Pin Tab'"
echo ""
echo "💡 Tip: When using Cursor's AI, reference these files:"
echo "   - CLAUDE.md for AI guidelines"
echo "   - TASKS.md for current work"
echo "   - docs/ARCHITECTURE.md for system overview"
