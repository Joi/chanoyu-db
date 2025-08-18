"use client";

import { useEffect, useRef } from 'react';

export default function NavBar() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const groups = Array.from(root.querySelectorAll('details.nav-group')) as HTMLDetailsElement[];
    function onToggle(this: HTMLDetailsElement) {
      if (this.open) {
        for (const d of groups) if (d !== this) d.open = false;
      }
    }
    function onDocumentClick(e: MouseEvent) {
      const target = e.target as Node;
      if (!root.contains(target)) {
        for (const d of groups) d.open = false;
      }
    }
    for (const d of groups) d.addEventListener('toggle', onToggle as any);
    document.addEventListener('click', onDocumentClick);
    return () => {
      for (const d of groups) d.removeEventListener('toggle', onToggle as any);
      document.removeEventListener('click', onDocumentClick);
    };
  }, []);

  return (
    <nav className="nav" style={{ display: 'flex', gap: 16, alignItems: 'center' }} ref={ref}>
      <details className="nav-group" role="menu">
        <summary className="nav-parent" role="button" aria-haspopup="true">Public</summary>
        <div className="nav-sub" role="menu">
          <a href="/">Home</a>
          <a href="/lookup">Category Lookup</a>
        </div>
      </details>
      <details className="nav-group" role="menu">
        <summary className="nav-parent" role="button" aria-haspopup="true">Collection Admin</summary>
        <div className="nav-sub" role="menu">
          <a href="/admin/items">Items</a>
          <a href="/admin/media">Media</a>
          <a href="/admin/classifications">Classifications</a>
          <a href="/admin/tea-schools">Tea Schools</a>
          <a href="/admin/new">Create object</a>
        </div>
      </details>
      <details className="nav-group" role="menu">
        <summary className="nav-parent" role="button" aria-haspopup="true">Users & Roles</summary>
        <div className="nav-sub" role="menu">
          <a href="/admin/members">Members</a>
          <a href="/login">Login</a>
        </div>
      </details>
    </nav>
  );
}


