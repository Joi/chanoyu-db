import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#FFFFFF',
        ink: '#111111',
        inkMuted: '#2B2B2B',
        inkSubtle: '#666666',
        line: 'rgba(0,0,0,0.08)',
        link: '#0645AD',
        // legacy aliases (keep for compatibility)
        background: '#fafafa',
        foreground: '#171717',
        primaryBlue: '#1A80B4',
        hoverBlue: '#146087',
        sectionBg: '#f5f5f5',
        borderGray: '#e5e5e5',
      },
      fontFamily: {
        sans: [
          'var(--font-inter)',
          'var(--font-noto-sans-jp)',
          'system-ui',
          'sans-serif',
        ],
        serif: [
          'var(--font-garamond)',
          'var(--font-noto-serif-jp)',
          'serif',
        ],
      },
    },
  },
  plugins: [],
}

export default config


