import './globals.css';

export const metadata = { title: 'Ito Collection', description: 'Tea utensil collection' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <a className="brand" href="/">Ito Collection</a>
            <nav className="nav" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <details className="nav-group">
                <summary className="nav-parent">Items</summary>
                <div className="nav-sub">
                  <a href="/admin/new">Create item</a>
                  <a href="/admin/items">List items</a>
                  <a href="/admin/items-and-images">Items and Images</a>
                </div>
              </details>
              <a href="/admin/media">Images</a>
              <a href="/admin/classifications">Classifications</a>
              <a href="/admin/tea-schools">Tea schools</a>
              <a href="/admin/members">Members</a>
              <a href="/lookup">Lookup</a>
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
