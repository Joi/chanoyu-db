import './globals.css';
import NavBar from './components/NavBar';

export const metadata = {
  title: 'Ito Collection',
  description: 'Tea utensil collection',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg'
  },
  manifest: '/manifest.json'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <header className="border-b border-borderGray bg-white">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
            <a className="font-extrabold text-lg no-underline text-inherit" href="/">Ito Collection</a>
            <NavBar />
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-6 py-6">{children}</div>
        <footer className="border-t border-borderGray bg-white">
          <div className="max-w-3xl mx-auto px-6 py-6 text-sm text-gray-600">© Ito Collection</div>
        </footer>
      </body>
    </html>
  );
}
