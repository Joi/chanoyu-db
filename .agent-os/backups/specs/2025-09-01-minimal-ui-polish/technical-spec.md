# Technical Specification

Implements @.agent-os/specs/2025-09-01-minimal-ui-polish/spec.md

## Theme Tokens
- Colors:
  - paper: #FFFFFF (light), #0E0E0E (dark)
  - ink: #111111 primary, #2B2B2B muted, #666666 subtle
  - line: rgba(0,0,0,0.08), dark rgba(255,255,255,0.12)
  - link: #0645AD (classic web blue)
- Radii: minimal (`rounded-lg` only on images)
- Shadows: none globally, very soft on overlays
- Typography scale: H1 2.125rem serif, H2 1.5rem serif, body 1rem sans with relaxed leading

## Fonts
```ts
// lib/fonts.ts
import { Inter, EB_Garamond, Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";

export const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
export const garamond = EB_Garamond({ subsets: ["latin"], variable: "--font-garamond" });
export const notoSansJP = Noto_Sans_JP({ subsets: ["latin"], variable: "--font-noto-sans-jp" });
export const notoSerifJP = Noto_Serif_JP({ subsets: ["latin"], variable: "--font-noto-serif-jp" });
// app/layout.tsx
<html
  lang="en"
  className={`${inter.variable} ${garamond.variable} ${notoSansJP.variable} ${notoSerifJP.variable}`}
>
  <body className="font-sans bg-paper text-ink">{children}</body>
</html>
// tailwind.config.ts (fonts)
fontFamily: {
  sans: ["var(--font-inter)", "var(--font-noto-sans-jp)", "system-ui", "sans-serif"],
  serif: ["var(--font-garamond)", "var(--font-noto-serif-jp)", "serif"],
}