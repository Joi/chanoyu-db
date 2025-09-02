# SPEC: UI Modernization with shadcn/ui

## Context
- Project: `chanoyu-db`
- Branch: `feature/minimal-ui-polish`
- Framework: Next.js (App Router) + TypeScript + Tailwind
- Goal: Replace ad-hoc UI with shadcn/ui primitives + design tokens inspired by joi.ito.com (minimal, high contrast, generous whitespace, restrained palette).
- Output: Starter setup with tokens, AppShell, header, and a Style Guide page for QA.

---

## Tasks

### 1. Install & initialize shadcn/ui
pnpm dlx shadcn@latest init -y

Choose:
- Framework: Next.js
- Language: TypeScript
- Styling: Tailwind
- Directory: components

Add core components:
pnpm dlx shadcn@latest add button card input label textarea select tabs dropdown-menu sheet dialog navigation-menu badge table skeleton toast tooltip sonner

---

### 2. Add design tokens (globals.css)
Edit app/globals.css and add near :root:

:root {
  /* Base */
  --bg: 255 255 255;
  --fg: 17 17 17;
  --muted: 240 5% 46%;

  /* Brand */
  --brand: 31 100% 50%;
  --link: 217 91% 60%;

  /* Surfaces */
  --card: 0 0% 100%;
  --border: 0 0% 88%;
  --ring: 217 91% 60%;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
}

[data-theme="dark"] {
  --bg: 15 15 15;
  --fg: 240 6% 95%;
  --muted: 240 5% 64%;
  --card: 18 18 18;
  --border: 0 0% 22%;
  --ring: 217 91% 70%;
}

Global typography:
.prose { max-width: 66ch; }
a { color: hsl(var(--link)); text-decoration: none; }
a:hover { text-decoration: underline; }

---

### 3. Configure Tailwind (tailwind.config.ts)
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "hsl(var(--bg))",
        fg: "hsl(var(--fg))",
        muted: "hsl(var(--muted))",
        brand: "hsl(var(--brand))",
        link: "hsl(var(--link))",
        card: "hsl(var(--card))",
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      maxWidth: { container: "1200px" },
      spacing: { grid: "8px" },
    },
  },
  plugins: [],
}
export default config

---

### 4. Create AppShell (src/components/app-shell.tsx)
export default function AppShell({
  header,
  sidebar,
  children,
}: {
  header?: React.ReactNode
  sidebar?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-40 border-b border-border/70 backdrop-blur">
        <div className="mx-auto max-w-container px-4 py-3">{header}</div>
      </header>
      <div className="mx-auto grid max-w-container grid-cols-12 gap-4 px-4 py-6">
        <aside className="col-span-3 hidden lg:block">{sidebar}</aside>
        <main className="col-span-12 lg:col-span-9">{children}</main>
      </div>
    </div>
  )
}

---

### 5. Create SiteHeader (src/components/site-header.tsx)
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"

export function SiteHeader() {
  return (
    <div className="flex items-center justify-between py-2">
      <a
        href="/"
        className="text-xl font-semibold tracking-tight hover:opacity-90"
      >
        Ito Chanoyu
      </a>
      <NavigationMenu>
        <NavigationMenuList className="hidden gap-2 sm:flex">
          <NavigationMenuItem>
            <a className="px-3 py-2 hover:underline" href="/objects">
              Objects
            </a>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <a className="px-3 py-2 hover:underline" href="/chakai">
              Chakai
            </a>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <a className="px-3 py-2 hover:underline" href="/locations">
              Locations
            </a>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <Button variant="default" className="hidden sm:inline-flex">
        Sign in
      </Button>
    </div>
  )
}

---

### 6. Wire Layout (app/(site)/layout.tsx)
import AppShell from "@/src/components/app-shell"
import { SiteHeader } from "@/src/components/site-header"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AppShell header={<SiteHeader />}>{children}</AppShell>
}

---

### 7. Create Style Guide page (app/style-guide/page.tsx)
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function StyleGuide() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Style Guide</h1>

      <section>
        <h2 className="text-xl font-semibold mb-4">Buttons</h2>
        <div className="flex gap-4">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Cards</h2>
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>Card content goes here.</CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Inputs</h2>
        <Input placeholder="Type here..." />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Tabs</h2>
        <Tabs defaultValue="account">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          <TabsContent value="account">Account settings</TabsContent>
          <TabsContent value="password">Password settings</TabsContent>
        </Tabs>
      </section>
    </div>
  )
}

---

### 8. Prettier setup
pnpm add -D prettier prettier-plugin-tailwindcss

Update .prettierrc:
{
  "plugins": ["prettier-plugin-tailwindcss"]
}

---

## Done
At this point:
- shadcn/ui is initialized
- Tokens and palette match joi.ito.com style
- AppShell + Header provide layout
- Style Guide page gives a quick QA view
- Prettier enforces class consistency

Next steps:
- Refactor existing pages to use Card, Button, etc.
- Extend Style Guide with Empty/Loading/Error states
- Tune --link/--brand values by sampling actual joi.ito.com colors

---

### 9. Add CollectionCard component (src/components/collection-card.tsx)
/**
 * CollectionCard
 * - Uses shadcn/ui + Tailwind utilities
 * - 8pt spacing, radius-md, shadow via ring on focus/hover
 * - Handles long JP/EN strings (truncate), loading/error/empty states
 * - Keyboard accessible: whole card is a link, secondary actions are buttons
 */
"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import * as React from "react"

export type CollectionCardProps = {
  href: string
  title: string
  subtitle?: string
  imageUrl?: string | null
  imageAlt?: string
  onPrimary?: () => void
  onSecondary?: () => void
  primaryLabel?: string
  secondaryLabel?: string
  className?: string
}

export function CollectionCard({
  href,
  title,
  subtitle,
  imageUrl,
  imageAlt = "",
  onPrimary,
  onSecondary,
  primaryLabel = "Open",
  secondaryLabel = "Quick view",
  className = "",
}: CollectionCardProps) {
  return (
    <Card className={`overflow-hidden transition-shadow hover:shadow-md ${className}`}>
      <Link href={href} className="block focus:outline-none focus:ring-2 focus:ring-ring">
        <div className="relative aspect-[4/3] w-full bg-neutral-100 dark:bg-neutral-800">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt || title}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 400px, 100vw"
              priority={false}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted">No image</div>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <div className="mb-2">
          <Link
            href={href}
            className="line-clamp-2 text-base font-medium leading-snug hover:underline"
          >
            {title}
          </Link>
          {subtitle ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted leading-relaxed">{subtitle}</p>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={onPrimary} aria-label={primaryLabel}>
            {primaryLabel}
          </Button>
          <Button size="sm" variant="secondary" onClick={onSecondary} aria-label={secondaryLabel}>
            {secondaryLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/** Loading / Empty helpers */
export function CollectionCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <CardContent className="p-4">
        <Skeleton className="mb-2 h-5 w-3/4" />
        <Skeleton className="mb-1 h-4 w-5/6" />
        <Skeleton className="h-8 w-40" />
      </CardContent>
    </Card>
  )
}

export function CollectionCardEmpty({ message = "No items yet" }: { message?: string }) {
  return (
    <Card className="grid place-items-center p-8 text-muted">
      {message}
    </Card>
  )
}

---

### 10. Example usage grid (app/examples/collection-grid/page.tsx)
/**
 * Simple responsive grid using the 12-col system:
 * - 3 cols on desktop, 2 on tablet, 1 on mobile
 * - Demonstrates long Japanese strings wrapping and truncation
 */
import { CollectionCard, CollectionCardSkeleton, CollectionCardEmpty } from "@/src/components/collection-card"

const data = [
  {
    href: "/objects/hoshino-bowl",
    title: "志野茶碗「羽衣」 — Momoyama-style Shino",
    subtitle: "美濃の土の温かみ。Long subtitle example to test wrapping and truncation with multi‑byte JP text.",
    imageUrl: "/images/sample/shino.jpg"
  },
  {
    href: "/objects/raku-nonko",
    title: "楽茶碗（ノンコ）",
    subtitle: "黒楽の柔らかな光沢",
    imageUrl: "/images/sample/raku.jpg"
  },
  {
    href: "/objects/karatsu",
    title: "唐津向付",
    subtitle: "刷毛目と鉄絵の表情",
    imageUrl: null
  }
]

export default function Page() {
  const loading = false
  const items = data

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CollectionCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!items?.length) {
    return <CollectionCardEmpty />
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <CollectionCard
          key={it.href}
          href={it.href}
          title={it.title}
          subtitle={it.subtitle}
          imageUrl={it.imageUrl}
          primaryLabel="Open"
          secondaryLabel="Quick view"
          onPrimary={() => console.log("open", it.href)}
          onSecondary={() => console.log("peek", it.href)}
        />
      ))}
    </div>
  )
}

---

### 11. Prompt hints (paste into Cursor before generating more UI)
- Use only shadcn/ui components (`Button`, `Card`, `Input`, `Dialog`, `Tabs`, `NavigationMenu`, `Skeleton`, `Tooltip`, `Toast`).
- Respect tokens in app/globals.css; do not invent colors/sizes.
- Layout: 12-column grid, 8pt spacing, `max-w-container` for page width, `.prose` for long text.
- States: Always include empty, loading, and error variants.
- A11y: Keyboard focus, proper `aria-*`, tap targets ≥ 44px, contrast AA.
- i18n: Test with long Japanese strings; apply `line-clamp-*` where needed.
