import './globals.css';

export const metadata = { title: 'Ito Collection', description: 'Tea utensil collection' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <a className="brand" href="/">Ito Collection</a>
            <nav className="nav">
              <a href="/lookup">Lookup</a>
              <a href="/login">Admin</a>
            </nav>
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
