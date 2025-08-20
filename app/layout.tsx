import './globals.css';
import NavBar from './components/NavBar';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/branding';

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
          <div className="max-w-3xl mx-auto px-6 py-6 text-sm text-gray-600">© {APP_NAME}</div>
        </footer>
      </body>
    </html>
  );
}
