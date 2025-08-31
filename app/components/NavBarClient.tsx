"use client";

import { useEffect, useRef } from 'react';

export default function NavBarClient({ isLoggedIn, isAdmin }: { isLoggedIn: boolean; isAdmin: boolean }) {
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
      <a className="font-medium text-sm" href="/">Home</a>
      <a className="font-medium text-sm" href="/lookup">Lookup</a>

      {isLoggedIn ? (
        isAdmin ? (
          <details className="nav-group relative group" role="menu">
            <summary className="list-none cursor-pointer font-medium [&::-webkit-details-marker]:hidden" role="button" aria-haspopup="true">Admin</summary>
            <div className="hidden group-open:block absolute left-0 mt-1 bg-white border border-borderGray rounded-md shadow-lg p-2 min-w-[220px] z-20" role="menu">
              <a className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/admin">Admin</a>
              <a className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/admin/members">Accounts</a>
              <a className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/admin/chakai">Chakai</a>
              <a className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/admin/items">Items</a>
              <a className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/admin/media">Media</a>
              <a className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/admin/local-classes" title="Project taxonomy (ローカル分類)">Local Classes</a>
              <a className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/admin/classifications" title="External authorities (AAT/Wikidata) — 分類（標準語彙）">Classifications</a>
              <a className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/admin/tea-schools">Tea Schools</a>
              <a className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/admin/members">Members</a>
            </div>
          </details>
        ) : (
          <>
            <a className="font-medium text-sm" href="/members">Members</a>
            <a className="font-medium text-sm" href="/chakai">Chakai</a>
            <a className="font-medium text-sm" href="/tea-rooms">Tea Rooms</a>
          </>
        )
      ) : null}

      {isLoggedIn ? (
        <details className="nav-group relative group" role="menu">
          <summary className="list-none cursor-pointer font-medium [&::-webkit-details-marker]:hidden" role="button" aria-haspopup="true">Account</summary>
          <div className="hidden group-open:block absolute left-0 mt-1 bg-white border border-borderGray rounded-md shadow-lg p-2 min-w-[220px] z-20" role="menu">
            {!isAdmin ? <a className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/members">Members</a> : null}
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


