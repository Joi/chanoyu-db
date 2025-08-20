#!/bin/bash

# Switch from npm to pnpm

echo "🔄 Switching from npm to pnpm..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

echo "🗑️  Removing npm artifacts..."
rm -rf node_modules
rm -f package-lock.json

echo "📦 Installing dependencies with pnpm..."
pnpm install

echo "✅ Switched to pnpm successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Commit the pnpm-lock.yaml file"
echo "2. Update your deployment scripts to use pnpm"
echo "3. Tell your team to use pnpm instead of npm"
echo ""
echo "🎯 Common commands:"
echo "  pnpm install     (instead of npm install)"
echo "  pnpm dev         (instead of npm run dev)"
echo "  pnpm build       (instead of npm run build)"
echo "  pnpm typecheck   (instead of npm run typecheck)"
