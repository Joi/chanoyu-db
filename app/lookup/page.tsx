'use client';

import { useEffect, useState } from 'react';

type Item = {
  scheme: 'aat' | 'wikidata';
  uri: string;
  id: string;
  label_en: string;
  label_ja: string;
  note?: string;
};

export default function LookupPage() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (query: string) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/lookup?q=${encodeURIComponent(query)}`);
      const j: Item[] = await r.json();
      setItems(j);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => q && search(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const aat = items.filter((i) => i.scheme === 'aat');
  const wd = items.filter((i) => i.scheme === 'wikidata');

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Category Lookup (AAT + Wikidata)</h1>
      <input
        className="border rounded p-2 w-full"
        placeholder="Search (e.g., chawan)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {loading ? <p className="mt-4 text-sm text-gray-500">Searching…</p> : null}

      {aat.length > 0 && (
        <section className="mt-5">
          <h2 className="text-sm font-semibold mb-2">AAT</h2>
          <ul className="space-y-2">
            {aat.map((it) => (
              <li key={`aat:${it.id}`} className="border rounded p-2">
                <div className="text-sm">
                  <strong>{it.label_en}</strong> {it.label_ja ? <span lang="ja">/ {it.label_ja}</span> : null}
                </div>
                <div className="text-xs text-gray-600">
                  <a className="underline" href={it.uri} target="_blank" rel="noreferrer">
                    {it.uri}
                  </a>
                  {it.note ? <span> — {it.note}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {wd.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold mb-2">Wikidata</h2>
          <ul className="space-y-2">
            {wd.map((it) => (
              <li key={`wd:${it.id}`} className="border rounded p-2">
                <div className="text-sm">
                  <strong>{it.label_en}</strong> {it.label_ja ? <span lang="ja">/ {it.label_ja}</span> : null}
                </div>
                <div className="text-xs text-gray-600">
                  <a className="underline" href={it.uri} target="_blank" rel="noreferrer">
                    {it.uri}
                  </a>
                  {it.note ? <span> — {it.note}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
