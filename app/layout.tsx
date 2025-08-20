import './globals.css';
import NavBar from './components/NavBar';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/branding';
import Image from 'next/image';

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
    <html lang="en">
      <body className="bg-background text-foreground">
        <header className="border-b border-borderGray bg-white">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
            <a className="font-extrabold text-lg no-underline text-inherit" href="/">{APP_NAME}</a>
            <NavBar />
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-6 py-6">{children}</div>
        <footer className="border-t border-borderGray bg-white">
          <div className="max-w-3xl mx-auto px-6 py-6 text-sm text-gray-600">
            <span className="inline-flex items-center gap-2">
              <span>© {APP_NAME}</span>
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center"
                aria-label="Creative Commons Attribution 4.0 International (CC BY 4.0)"
                title="Creative Commons Attribution 4.0 International (CC BY 4.0)"
              >
                <Image
                  src="https://licensebuttons.net/l/by/4.0/88x31.png"
                  alt="CC BY 4.0"
                  width={88}
                  height={31}
                  className="h-5 w-auto"
                />
                <span className="sr-only">Licensed under CC BY 4.0</span>
              </a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
