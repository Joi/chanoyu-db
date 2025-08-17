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
                <summary className="nav-parent">Collection</summary>
                <div className="nav-sub">
                  <a href="/">Home</a>
                  <a href="/admin/items">Items</a>
                  <a href="/admin/media">Media</a>
                </div>
              </details>
              <details className="nav-group">
                <summary className="nav-parent">Tools</summary>
                <div className="nav-sub">
                  <a href="/lookup">Lookup</a>
                  <a href="/admin/new">Create object</a>
                </div>
              </details>
              <details className="nav-group">
                <summary className="nav-parent">User Management</summary>
                <div className="nav-sub">
                  <a href="/admin/members">Members</a>
                </div>
              </details>
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
