# Testing Guide

## Quick Test Commands

```bash
# Type checking (most important)
pnpm typecheck

# Linting
pnpm lint

# Run all tests
pnpm test

# Run specific test
pnpm test -- chakai
```

## What to Test

### Before Every Push
1. ✅ TypeScript compiles (`pnpm typecheck`)
2. ✅ App builds (`pnpm build`)
3. ✅ Basic pages load (`pnpm dev`)

### Before PR to Main
1. All of the above
2. Test on your feature branch's Vercel preview URL
3. Check mobile view
4. Verify images load
5. Test any new features end-to-end
6. Verify local Docker Supabase migrations work

## Manual Testing Checklist

### For Object Pages
- [ ] `/id/[token]` loads
- [ ] Images display
- [ ] JSON-LD works: `curl -H "Accept: application/ld+json"`
- [ ] Visibility rules work

### For Chakai (Events)
- [ ] List page shows events
- [ ] Can create new event (admin)
- [ ] Attendees can be added
- [ ] Items can be linked
- [ ] Location search works

### For Images
- [ ] Upload works
- [ ] HEIC converts to JPEG
- [ ] Thumbnails generate
- [ ] Storage URLs are public

## Common Issues

### TypeScript Errors
```bash
# See all errors
pnpm typecheck

# Fix auto-fixable issues
pnpm lint --fix
```

### Database Issues
1. Check Supabase dashboard
2. Verify RLS policies
3. Test query directly in SQL editor

### Image Issues
1. Check file size (< 5MB recommended)
2. Verify storage bucket is public
3. Check CORS settings in Supabase

## Adding Tests

Create test files next to the code:
```
/app/chakai/page.tsx
/app/chakai/page.test.tsx  # Add test here
```

Basic test template:
```typescript
import { describe, it, expect } from 'vitest'

describe('Chakai Page', () => {
  it('should load chakai list', async () => {
    // Test code here
  })
})
```

## CI/CD Tests

These run automatically on PR:
1. TypeScript check
2. ESLint
3. Build verification
4. Basic smoke tests

You don't need to set these up - they're already configured!
