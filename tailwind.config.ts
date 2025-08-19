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
        background: '#fafafa',
        foreground: '#171717',
        primaryBlue: '#1A80B4',
        hoverBlue: '#146087',
        sectionBg: '#f5f5f5',
        borderGray: '#e5e5e5',
      },
      fontFamily: {
        sans: [
          'Avenir', 'Montserrat', 'Corbel', 'URW Gothic', 'source-sans-pro',
          '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}

export default config


