"use client";

import { useEffect, useRef } from 'react';

export default function NavBarClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const groups = Array.from(container.querySelectorAll('details.nav-group')) as HTMLDetailsElement[];
    function onToggle(this: HTMLDetailsElement) {
      if (this.open) {
        for (const d of groups) if (d !== this) d.open = false;
      }
    }
    function onDocumentClick(e: MouseEvent) {
      const target = e.target as Node;
      if (container && !container.contains(target)) {
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
    <nav className="flex gap-4 items-center" ref={ref}>
      <details className="nav-group relative group" role="menu">
        <summary className="list-none cursor-pointer font-medium [&::-webkit-details-marker]:hidden" role="button" aria-haspopup="true">Public</summary>
        <div className="hidden group-open:block absolute left-0 mt-1 bg-white border border-borderGray rounded-md shadow-lg p-2 min-w-[220px] z-20" role="menu">
          <a className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/">Home</a>
          <a className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/lookup">Category Lookup</a>
          <a className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/chakai">Chakai</a>
        </div>
      </details>

      {isLoggedIn ? (
        <details className="nav-group relative group" role="menu">
          <summary className="list-none cursor-pointer font-medium [&::-webkit-details-marker]:hidden" role="button" aria-haspopup="true">Collection Admin</summary>
          <div className="hidden group-open:block absolute left-0 mt-1 bg-white border border-borderGray rounded-md shadow-lg p-2 min-w-[220px] z-20" role="menu">
            <a className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/admin/items">Items</a>
            <a className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/admin/media">Media</a>
            <a className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/admin/classifications">Classifications</a>
            <a className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/admin/tea-schools">Tea Schools</a>
            <a className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/admin/tea-rooms">Tea Rooms</a>
            <a className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/admin/chakai">Chakai</a>
            <a className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/admin/new">Create object</a>
          </div>
        </details>
      ) : null}

      {isLoggedIn ? (
        <details className="nav-group relative group" role="menu">
          <summary className="list-none cursor-pointer font-medium [&::-webkit-details-marker]:hidden" role="button" aria-haspopup="true">Account</summary>
          <div className="hidden group-open:block absolute left-0 mt-1 bg-white border border-borderGray rounded-md shadow-lg p-2 min-w-[220px] z-20" role="menu">
            <a className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/admin/members">Members</a>
            <form action="/logout" method="post">
              <button className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-50 rounded" type="submit">Sign out</button>
            </form>
          </div>
        </details>
      ) : (
        <a className="font-medium text-sm hover:underline" href="/login">Login</a>
      )}
    </nav>
  );
}


