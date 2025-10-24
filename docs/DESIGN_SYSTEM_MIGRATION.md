# Tea Ceremony Design System Migration

**Date:** 2025-10-24
**Status:** Phase 1 Complete

## What Changed

### 1. CSS Design System (app/globals.css)

**Added tea ceremony color vocabulary:**

```css
/* Core Tea Ceremony Colors */
--shibui: 25 20% 45%;        /* 渋い - Subtle elegance (muted brown) */
--wabi: 40 20% 95%;          /* 侘び - Aged beauty (warm off-white) */
--yugen: 210 20% 25%;        /* 幽玄 - Profound grace (deep blue-gray) */
--matcha: 100 30% 35%;       /* 抹茶 - Tea green for accents */

/* Spacing as 間 (ma) - Negative Space */
--ma-sm: 0.75rem;            /* 小間 - Small pause */
--ma-md: 1.5rem;             /* 中間 - Natural breath */
--ma-lg: 3rem;               /* 大間 - Contemplative space */
```

**Added utility classes:**
- `.card` - Card component styling with hover effects
- `:lang(ja)` / `:lang(en)` - Bilingual typography support
- `.ma-sm/md/lg` - Margin utilities
- `.pa-sm/md/lg` - Padding utilities

### 2. Tailwind Config (tailwind.config.ts)

**Removed duplicate color definitions:**
- ❌ Removed `joi.blue`, `primaryBlue`, `secondaryBlue`
- ❌ Removed `paper`, `ink`, `link` custom colors
- ❌ Removed `sectionBg`, `borderGray`, `hoverBlue`

**Added tea ceremony colors:**
- ✅ `shibui` - Available as `bg-shibui`, `text-shibui`, `border-shibui`
- ✅ `wabi` - Available as `bg-wabi`, `text-wabi`
- ✅ `yugen` - Available as `bg-yugen`, `text-yugen`
- ✅ `matcha` - Available as `bg-matcha`, `text-matcha`

### 3. Components Created

**app/components/Card.tsx** - Reusable card component
- Supports href (clickable links)
- Title and subtitle
- Children content
- Hover effects
- Uses ma-based padding

### 4. Pages Updated

**app/admin/page.tsx**
- Now uses imported Card component
- Applied ma spacing (`pa-lg` for main padding)
- Applied structural bilingual to title
- Updated to use tea ceremony colors
- Responsive grid (1/2/3 columns)

### 5. Documentation Created

- `docs/TEA_CEREMONY_DESIGN_SYSTEM.md` - Complete design system guide
- `docs/DESIGN_SYSTEM_MIGRATION.md` - This file
- `app/design-test/page.tsx` - Live design system showcase

## Strategic Impact

### Problems Solved

✅ **Design system fragmentation** - One unified system
✅ **Missing card component** - Now properly defined
✅ **No clear design language** - Tea ceremony philosophy embedded
✅ **Inconsistent spacing** - Ma-based spacing system
✅ **Bilingual typography gaps** - :lang() selector support

### Philosophy Alignment

The design system now embodies:
- **渋い (Shibui)** - Subtle, unobtrusive elegance
- **侘び (Wabi)** - Beauty in imperfection, naturalness
- **幽玄 (Yugen)** - Profound grace, subtle depth
- **間 (Ma)** - Meaningful negative space

## Before/After Comparison

### Before: Fragmented

```tsx
// Three competing color systems
<div className="bg-white border-gray-200">
  <h1 style={{ color: 'var(--primary)' }}>Title</h1>
  <button className="bg-joi-blue">Action</button>
</div>
```

### After: Unified

```tsx
// One tea ceremony system
<Card title="Title">
  <button className="bg-matcha text-wabi">Action</button>
</Card>
```

## Migration Guide

### For Developers

**When adding new colors:**
1. Don't add arbitrary colors
2. Ask: "Is this shibui (subtle)? wabi (natural)? yugen (deep)? matcha (accent)?"
3. Use the existing tea ceremony palette
4. Only add new colors if they represent a new tea ceremony concept

**When adding spacing:**
1. Use ma utilities: `ma-sm`, `ma-md`, `ma-lg`
2. Think of space as "breathing room" not "pixels"
3. Default to `ma-md` for natural spacing

**For bilingual content:**
```tsx
// Good: Structural bilingual
<h1>
  <span lang="en">Title</span>
  <span lang="ja">タイトル</span>
</h1>

// Also acceptable: Single language with lang attribute
<p lang="ja">日本語のテキスト</p>
```

## Usage Examples

### Cards

```tsx
import Card from '@/app/components/Card'

// Simple card
<Card title="Tea Bowl" subtitle="茶碗" />

// Linked card
<Card href="/admin/items" title="Items" subtitle="道具" />

// With content
<Card title="Collection" subtitle="コレクション">
  <p className="text-sm">Additional details...</p>
</Card>
```

### Colors in Components

```tsx
// Background and text
<div className="bg-wabi text-yugen">Content</div>

// Borders
<div className="border border-shibui">Content</div>

// Accents
<button className="bg-matcha text-wabi">Action</button>

// Hover states
<a className="text-shibui hover:text-shibui/80">Link</a>
```

### Spacing

```tsx
// Padding
<main className="pa-lg">Large contemplative padding</main>
<section className="pa-md">Natural breathing room</section>

// Margin
<article className="ma-md">Natural spacing around</article>

// Or use Tailwind's existing spacing
<div className="p-6">Also works</div>
```

## Next Steps (Future Phases)

### Phase 2: Semantic HTML Migration

Replace `.card` with semantic `<article>`:

```tsx
// Current
<div className="card">...</div>

// Future
<article>...</article>
```

Benefits:
- Better accessibility
- Better SEO
- Less CSS needed
- Embraces wabi (browser defaults)

### Phase 3: Ma-Based Navigation

Remove mobile hamburger menu:
- Apply generous ma spacing
- Let content flow naturally
- Navigation through space, not menus

### Phase 4: Full Structural Bilingual

Migrate all text to structural bilingual:

```tsx
<p>
  <span lang="en">This is a tea bowl</span>
  {' '}
  <span lang="ja">これは茶碗です</span>
</p>
```

Benefits:
- Screen readers auto-switch
- No i18n library needed
- Proper SEO signals
- Typography rules per language

## Testing

### Visual Test

Visit: http://localhost:3000/design-test

Shows:
- Tea ceremony color palette
- Ma spacing examples
- Card components
- Bilingual typography
- Design philosophy

### Production Pages

- `/admin` - Admin dashboard with new cards
- `/` - Public homepage
- `/id/{token}` - Object pages (future update)

## Rollback Plan

If needed, revert changes:

```bash
git checkout main -- app/globals.css tailwind.config.ts
git checkout main -- app/admin/page.tsx
rm app/components/Card.tsx
rm app/design-test/page.tsx
rm docs/TEA_CEREMONY_DESIGN_SYSTEM.md
```

## Success Metrics

- ✅ One unified color system (was 3)
- ✅ Card component works (was missing)
- ✅ Philosophy-aligned naming (self-documenting)
- ✅ Bilingual typography support (automatic)
- ✅ Ma-based spacing (intentional breathing room)
- ✅ No breaking changes (semantic mappings preserve compatibility)

## Lessons Learned

This migration demonstrates the power of **philosophical alignment**:

1. **Design fragmentation signals deeper misalignment** - Three color systems existed because the design was fighting the philosophy
2. **Tea ceremony vocabulary forces good decisions** - When reaching for a color, you must ask if it's shibui, wabi, or yugen
3. **Self-documenting code through semantics** - `var(--ma-md)` tells you it's "natural breathing room"
4. **Cultural context drives technical decisions** - The design system teaches tea ceremony through usage

## Credits

**Strategic Analysis:** zen-architect + insight-synthesizer agents
**Implementation:** Applied tea ceremony aesthetics to technical design
**Philosophy:** Ruthless simplicity through cultural coherence
