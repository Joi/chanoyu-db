import { Inter, EB_Garamond, Montserrat, Noto_Sans_JP, Noto_Serif_JP } from 'next/font/google'

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const garamond = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-garamond',
  display: 'swap',
})

export const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const notoSansJP = Noto_Sans_JP({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
})

export const notoSerifJP = Noto_Serif_JP({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-noto-serif-jp',
  display: 'swap',
})


