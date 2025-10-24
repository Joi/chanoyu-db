# Tea Ceremony Design System

## Philosophy

This design system aligns technical decisions with tea ceremony aesthetics, creating a cohesive visual and conceptual framework that reflects the cultural context of the collection.

### Core Principles

**渋い (shibui)** - Subtle, unobtrusive elegance
- Colors are muted, never garish
- Interactions are understated
- Design recedes in service to content

**侘び (wabi)** - Beauty in imperfection and naturalness
- Embrace browser rendering differences
- Asymmetry over rigid grids
- Organic, not mechanical

**幽玄 (yugen)** - Profound grace and mysterious depth
- Deep, contemplative colors
- Layered meaning through semantic HTML
- Subtle transitions and micro-interactions

**間 (ma)** - Negative space, pause, breathing room
- Space between elements is intentional
- Generous margins create contemplation
- Silence is as important as content

## Color Vocabulary

### Tea Ceremony Colors

```css
--shibui: 25 20% 45%;   /* 渋い - Subtle elegance (muted brown) */
--wabi: 40 20% 95%;     /* 侘び - Aged beauty (warm off-white) */
--yugen: 210 20% 25%;   /* 幽玄 - Profound grace (deep blue-gray) */
--matcha: 100 30% 35%;  /* 抹茶 - Tea green for accents */
```

### Usage in Tailwind

```tsx
<div className="bg-wabi text-yugen">
  <h1 className="text-shibui">Tea Bowl Collection</h1>
  <button className="bg-matcha text-wabi">View Details</button>
</div>
```

### Semantic Mappings

The tea ceremony colors map to Shadcn semantic tokens:

- `--background` → `--wabi` (aged beauty as canvas)
- `--foreground` → `--yugen` (profound depth for text)
- `--primary` → `--shibui` (subtle elegance for primary actions)
- `--secondary` → `--matcha` (tea green for accents)

This allows existing Shadcn components to work seamlessly while embodying tea ceremony aesthetics.

## Spacing: 間 (ma)

### The Philosophy of Ma

Ma (間) is the Japanese concept of negative space - the pause between notes in music, the space between objects, the silence in conversation. In UI design, ma creates breathing room and contemplation.

### Ma Scale

```css
--ma-sm: 0.75rem;  /* 小間 - Small pause */
--ma-md: 1.5rem;   /* 中間 - Natural breath */
--ma-lg: 3rem;     /* 大間 - Contemplative space */
```

### Usage

```tsx
// Using custom properties
<div style={{ padding: 'var(--ma-md)' }}>Content</div>

// Using utility classes
<div className="pa-md">Content with natural breathing room</div>

// In layouts
<section className="ma-lg">
  <article className="pa-md">Object details</article>
</section>
```

## Typography: Bilingual Structure

### The :lang() Approach

Instead of treating bilingual as a feature bolted on through translation libraries, we make it **structural** using HTML `lang` attributes and CSS `:lang()` selectors.

```tsx
// Structural bilingual
<h1>
  <span lang="en">Tea Bowl Collection</span>
  <span lang="ja">茶碗コレクション</span>
</h1>
```

```css
/* Automatic typography per language */
:lang(ja) {
  letter-spacing: 0.05em;
  line-height: 1.8;
}

:lang(en) {
  letter-spacing: 0.01em;
  line-height: 1.6;
}
```

### Benefits

- **Accessibility**: Screen readers automatically switch voice/language
- **SEO**: Search engines get proper language signals
- **Typography**: Language-specific rules apply automatically
- **No i18n library**: HTML IS the internationalization system
- **Simplicity**: No translation lookup, no state management

## Components

### Card Component

The `.card` class follows tea ceremony principles:

```tsx
import Card from '@/app/components/Card'

<Card
  href="/id/abc123"
  title="Black Raku chawan"
  subtitle="ITO-2025-001"
>
  A beautiful example of wabi-sabi aesthetics
</Card>
```

**Philosophy:**
- Uses `--ma-md` for padding (natural breathing room)
- Subtle borders using `--shibui`
- Hover effects are understated (wabi principle)
- Future: migrate to semantic `<article>` HTML

### Buttons

```tsx
<button className="btn btn-primary">
  View Collection
</button>
```

Uses `--shibui` (subtle elegance) for primary actions.

## Design System Evolution

### Phase 1: Foundation (Completed)
- ✅ Tea ceremony color vocabulary
- ✅ Ma-based spacing system
- ✅ Bilingual typography support
- ✅ Card component

### Phase 2: Semantic HTML (Recommended)
- Migrate `.card` to `<article>` semantic HTML
- Use `<aside>` for admin sidebar
- Apply ARIA labels for accessibility
- Embrace browser defaults more

### Phase 3: Ma-Based Navigation
- Remove hamburger menu
- Navigation through space, not menus
- Admin/public distinction becomes spatial
- Content flows with generous ma

## Code Examples

### Before: Fragmented Design System

```css
/* Three competing color systems */
--primary: #3b82f6;
--joi-blue: #1A80B4;
var(--link)
```

### After: Tea Ceremony Unity

```css
/* One system, philosophically aligned */
--shibui: 25 20% 45%;
--wabi: 40 20% 95%;
--yugen: 210 20% 25%;
```

### Before: Generic Card

```tsx
<div className="bg-white border rounded p-4">
  Content
</div>
```

### After: Tea Ceremony Card

```tsx
<Card title="Tea Bowl">
  <span lang="en">Beautiful example</span>
  <span lang="ja">美しい例</span>
</Card>
```

## Learning Resources

To understand the tea ceremony concepts:

- **Shibui (渋い)**: Subtle taste, astringent beauty
- **Wabi (侘び)**: Rustic simplicity, quietness
- **Yugen (幽玄)**: Mysterious profundity
- **Ma (間)**: Pause, space, interval

Recommended reading:
- "The Book of Tea" by Okakura Kakuzō
- "Wabi-Sabi for Artists, Designers, Poets & Philosophers" by Leonard Koren

## FAQ

**Q: Isn't this just cute naming?**

No. Forcing design decisions to align with philosophy makes the system self-policing. When choosing a color, you must ask: "Is this shibui (subtle)?" This creates consistency through conceptual alignment, not arbitrary rules.

**Q: What if developers don't know Japanese tea ceremony concepts?**

The CSS itself teaches the concepts. Seeing `var(--wabi)` in code prompts "What is wabi?" Learning the concept improves design decisions. The design system becomes pedagogical.

**Q: Can I still use regular Tailwind utilities?**

Yes! The tea ceremony colors are available as Tailwind colors:

```tsx
<div className="bg-wabi text-yugen border-shibui">
```

Spacing and layout utilities work normally. We only changed the color system.

**Q: How do I migrate existing components?**

Gradually. The semantic mappings ensure existing Shadcn components work. Migrate one component at a time to tea ceremony vocabulary as you touch them.

## Conclusion

This design system isn't just about colors - it's about **aligning technical decisions with cultural philosophy**. Every CSS variable, every spacing choice, every component reflects tea ceremony aesthetics.

The code becomes a teaching tool. Developers learn shibui, wabi, ma by using them. The UI embodies the culture of the collection it presents.

This is ruthless simplicity through philosophical coherence.
