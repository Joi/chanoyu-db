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
      <body>
        <header className="header">
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <a className="brand" href="/">Ito Collection</a>
            <NavBar />
          </div>
        </header>
        <div className="container">{children}</div>
        <footer className="footer">
          <div className="container">© Ito Collection</div>
        </footer>
      </body>
    </html>
  );
}
