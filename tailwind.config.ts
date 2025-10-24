import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: ['class'],
    content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  			 * Chanoyu Design System - Tea Ceremony Colors
  			 * All colors now sourced from CSS custom properties in globals.css
  			 * Legacy color names removed to eliminate fragmentation
  			 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

  			// Tea ceremony aesthetic colors (direct CSS custom properties)
  			shibui: 'hsl(var(--shibui))',      // 渋い - Subtle elegance
  			wabi: 'hsl(var(--wabi))',          // 侘び - Aged beauty
  			yugen: 'hsl(var(--yugen))',        // 幽玄 - Profound grace
  			matcha: 'hsl(var(--matcha))',      // 抹茶 - Tea green

  			// Semantic color mappings (Shadcn compatible)
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			// joi.ito.com design system typography
  			sans: [
  				'Avenir', // System font (if available)
  				'var(--font-montserrat)', // Google Fonts fallback
  				'var(--font-noto-sans-jp)', // Japanese support
  				'system-ui',
  				'sans-serif'
  			],
  			// Legacy Inter support (for compatibility)
  			inter: [
  				'var(--font-inter)',
  				'var(--font-noto-sans-jp)',
  				'system-ui',
  				'sans-serif'
  			],
  			serif: [
  				'var(--font-garamond)',
  				'var(--font-noto-serif-jp)',
  				'serif'
  			]
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			// joi.ito.com signature rounded corners
  			joi: '20px',
  			'20': '20px',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}

export default config


