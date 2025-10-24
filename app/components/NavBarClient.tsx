"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type ObjectSearchResult = {
  id: string;
  token: string;
  title?: string | null;
  title_ja?: string | null;
  local_number?: string | null;
};

export default function NavBarClient({ isLoggedIn, isAdmin }: { isLoggedIn: boolean; isAdmin: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ObjectSearchResult[]>([]);
  const [openSearch, setOpenSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Close all dropdown menus
  const closeAllDropdowns = () => {
    const container = ref.current;
    if (!container) return;
    const groups = Array.from(container.querySelectorAll('details.nav-group')) as HTMLDetailsElement[];
    for (const d of groups) d.open = false;
  };

  // Handle desktop dropdown menus
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const groups = Array.from(container.querySelectorAll('details.nav-group')) as HTMLDetailsElement[];

    // Close other dropdowns when one opens
    function onToggle(this: HTMLDetailsElement) {
      if (this.open) {
        for (const d of groups) if (d !== this) d.open = false;
      }
    }

    // Close dropdowns when clicking outside
    function onDocumentClick(e: MouseEvent) {
      const target = e.target as Node;
      if (container && !container.contains(target)) {
        for (const d of groups) d.open = false;
      }
    }

    // Close dropdowns when clicking a link inside them
    function onLinkClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' || target.closest('a')) {
        closeAllDropdowns();
      }
    }

    const onToggleListener: EventListener = onToggle as unknown as EventListener;
    for (const d of groups) {
      d.addEventListener('toggle', onToggleListener);
      d.addEventListener('click', onLinkClick);
    }
    document.addEventListener('click', onDocumentClick);

    return () => {
      for (const d of groups) {
        d.removeEventListener('toggle', onToggleListener);
        d.removeEventListener('click', onLinkClick);
      }
      document.removeEventListener('click', onDocumentClick);
    };
  }, []);

  // Handle mobile menu close on outside click
  useEffect(() => {
    if (!mobileOpen) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setMobileOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMobileOpen(false);
      }
    }

    // Small delay to prevent immediate closing
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [mobileOpen]);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      if (!query.trim()) { setResults([]); setOpenSearch(false); return; }
      try {
        setIsLoading(true);
        const r = await fetch(`/api/search/objects?q=${encodeURIComponent(query.trim())}`, { cache: 'no-store' });
        if (!alive) return;
        if (!r.ok) { setResults([]); setIsLoading(false); return; }
        const json = (await r.json()) as unknown;
        const arr = Array.isArray(json) ? json : [];
        const mapped: ObjectSearchResult[] = arr.map((it: any) => ({
          id: String(it.id ?? ''),
          token: String(it.token ?? ''),
          title: it.title ?? null,
          title_ja: it.title_ja ?? null,
          local_number: it.local_number ?? null,
        })).filter((it: ObjectSearchResult) => it.id && it.token);
        setResults(mapped);
        setOpenSearch(true);
      } catch (err) {
        if (alive) {
          console.error('[navbar search] request failed', err);
          setResults([]);
        }
      } finally {
        if (alive) setIsLoading(false);
      }
    }, 200);
    return () => { alive = false; clearTimeout(t); };
  }, [query]);

  return (
    <nav className="flex gap-3 items-center" ref={ref}>
      <Link href="/" className="font-semibold text-lg hover:opacity-90 mr-4">
        Ito Chanoyu
      </Link>
      <button
        className="md:hidden inline-flex items-center justify-center rounded-lg px-3 py-2 border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Open menu"
        onClick={() => setMobileOpen(true)}
      >
        Menu
      </button>
      <Link className="font-medium text-sm hidden md:inline" href="/members">Members</Link>
      <Link className="font-medium text-sm hidden md:inline" href="/objects">Objects</Link>
      <Link className="font-medium text-sm hidden md:inline" href="/chakai">Chakai</Link>
      <Link className="font-medium text-sm hidden md:inline" href="/media">Media</Link>
      <Link className="hidden md:inline btn btn-outline text-sm" href="/lookup" role="button">Lookup</Link>

      <div className="relative hidden md:block">
        <input
          className="border rounded px-2 py-1 text-sm min-w-[220px]"
          placeholder="Search objects…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setOpenSearch(true)}
          onKeyDown={(e) => { if (e.key === 'Escape') setOpenSearch(false); }}
          aria-label="Search objects"
          aria-busy={isLoading}
        />
        {openSearch ? (
          <div className="absolute left-0 right-0 mt-1 bg-card border border-border rounded-md shadow z-20 max-h-64 overflow-auto">
            {isLoading ? (
              <div className="px-2 py-2 text-sm text-muted-foreground">Searching…</div>
            ) : results.length ? (
              results.map((r) => {
                const label = String(r.title || r.title_ja || r.local_number || r.token);
                return (
                  <Link key={r.id} href={`/id/${r.token}`} className="block px-2 py-1 text-sm hover:bg-muted" onClick={() => setOpenSearch(false)}>
                    {label}
                  </Link>
                );
              })
            ) : null}
          </div>
        ) : null}
      </div>

      {isLoggedIn ? (
        isAdmin ? (
          <details className="nav-group relative group" role="menu">
            <summary className="list-none cursor-pointer font-medium [&::-webkit-details-marker]:hidden" role="button" aria-haspopup="true">Admin</summary>
            <div className="hidden group-open:block absolute left-0 mt-1 bg-card border border-border rounded-md shadow-lg p-2 min-w-[220px] z-20" role="menu">
              <Link className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/admin">Admin</Link>
              <Link className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/admin/chakai">Chakai</Link>
              <Link className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/admin/items">Items</Link>
              <Link className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/admin/media">Media</Link>
              <Link className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/admin/local-classes" title="Project taxonomy (ローカル分類)">Local Classes</Link>
              <Link className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/admin/classifications" title="External authorities (AAT/Wikidata) — 分類（標準語彙）">Classifications</Link>
              <Link className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/admin/tea-schools">Tea Schools</Link>
              <Link className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/admin/members">Manage Members</Link>
            </div>
          </details>
        ) : (
          <>
            <Link className="font-medium text-sm hidden md:inline" href="/members">Members</Link>
            <Link className="font-medium text-sm hidden md:inline" href="/objects">Objects</Link>
            <Link className="font-medium text-sm hidden md:inline" href="/chakai">Chakai</Link>
            <Link className="font-medium text-sm hidden md:inline" href="/media">Media</Link>
          </>
        )
      ) : null}

      {isLoggedIn ? (
        <details className="nav-group relative group" role="menu">
          <summary className="list-none cursor-pointer font-medium [&::-webkit-details-marker]:hidden" role="button" aria-haspopup="true">Account</summary>
          <div className="hidden group-open:block absolute left-0 mt-1 bg-card border border-border rounded-md shadow-lg p-2 min-w-[220px] z-20" role="menu">
            {!isAdmin ? <Link className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/members">Members</Link> : null}
            {!isAdmin ? <Link className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/objects">Objects</Link> : null}
            {!isAdmin ? <Link className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/chakai">Chakai</Link> : null}
            {!isAdmin ? <Link className="block px-2 py-1 text-sm hover:bg-gray-50 rounded" href="/media">Media</Link> : null}
            <form action="/logout" method="post">
              <button className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-50 rounded" type="submit">Sign out</button>
            </form>
          </div>
        </details>
      ) : (
        <Link className="hidden md:inline btn btn-primary text-sm" href="/login" role="button">Login</Link>
      )}

      {mobileOpen ? (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMobileOpen(false)} />
          <div ref={mobileMenuRef} className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border p-4 grid gap-3">
            <div className="flex items-center justify-between">
              <strong>Menu</strong>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="px-3 py-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Close</button>
            </div>
            <input
              className="border rounded px-2 py-1 text-sm"
              placeholder="Search objects…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search objects"
            />
            <Link href="/members" className="text-sm" onClick={() => setMobileOpen(false)}>Members</Link>
            <Link href="/objects" className="text-sm" onClick={() => setMobileOpen(false)}>Objects</Link>
            <Link href="/chakai" className="text-sm" onClick={() => setMobileOpen(false)}>Chakai</Link>
            <Link href="/media" className="text-sm" onClick={() => setMobileOpen(false)}>Media</Link>
            <Link href="/lookup" className="text-sm" onClick={() => setMobileOpen(false)}>Lookup</Link>
            {isLoggedIn ? (
              isAdmin ? (
                <div className="grid gap-1">
                  <Link className="text-sm" href="/admin" onClick={() => setMobileOpen(false)}>Admin</Link>
                  <Link className="text-sm" href="/admin/chakai" onClick={() => setMobileOpen(false)}>Chakai</Link>
                  <Link className="text-sm" href="/admin/items" onClick={() => setMobileOpen(false)}>Items</Link>
                  <Link className="text-sm" href="/admin/media" onClick={() => setMobileOpen(false)}>Media</Link>
                  <Link className="text-sm" href="/admin/local-classes" onClick={() => setMobileOpen(false)}>Local Classes</Link>
                  <Link className="text-sm" href="/admin/classifications" onClick={() => setMobileOpen(false)}>Classifications</Link>
                  <Link className="text-sm" href="/admin/tea-schools" onClick={() => setMobileOpen(false)}>Tea Schools</Link>
                  <Link className="text-sm" href="/admin/members" onClick={() => setMobileOpen(false)}>Manage Members</Link>
                </div>
              ) : (
                <div className="grid gap-1">
                  <Link className="text-sm" href="/members" onClick={() => setMobileOpen(false)}>Members</Link>
                  <Link className="text-sm" href="/objects" onClick={() => setMobileOpen(false)}>Objects</Link>
                  <Link className="text-sm" href="/chakai" onClick={() => setMobileOpen(false)}>Chakai</Link>
                  <Link className="text-sm" href="/media" onClick={() => setMobileOpen(false)}>Media</Link>
                </div>
              )
            ) : null}
            {isLoggedIn ? (
              <form action="/logout" method="post">
                <button className="text-sm underline" type="submit">Sign out</button>
              </form>
            ) : (
              <Link className="text-sm" href="/login" onClick={() => setMobileOpen(false)}>Login</Link>
            )}
            {openSearch ? (
              <div className="mt-2 border-t border-border pt-2 max-h-48 overflow-auto">
                {isLoading ? (
                  <div className="px-2 py-2 text-sm text-muted-foreground">Searching…</div>
                ) : results.length ? (
                  results.map((r) => {
                    const label = String(r.title || r.title_ja || r.local_number || r.token);
                    return (
                      <Link key={r.id} href={`/id/${r.token}`} className="block px-1 py-1 text-sm hover:bg-muted" onClick={() => setMobileOpen(false)}>
                        {label}
                      </Link>
                    );
                  })
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </nav>
  );
}


