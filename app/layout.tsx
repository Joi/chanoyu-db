import './globals.css';
import AppShell from '@/src/components/app-shell';
import NavBar from '@/app/components/NavBar';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/branding';
import Image from 'next/image';
import { inter, garamond, notoSansJP, notoSerifJP } from '@/lib/fonts';
import { Toaster } from 'sonner';

export const metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg'
  },
  manifest: '/manifest.webmanifest'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${garamond.variable} ${notoSansJP.variable} ${notoSerifJP.variable}`}>
      <body className="font-sans">
        <AppShell header={<NavBar />}>{children}</AppShell>
        <Toaster />
      </body>
    </html>
  );
}
