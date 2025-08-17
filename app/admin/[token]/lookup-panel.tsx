'use client';

import { useEffect, useRef, useState } from 'react';

type Item = {
  scheme: 'aat' | 'wikidata';
  uri: string;
  id: string;
  label_en: string;
  label_ja: string;
  note?: string;
};

export default function LookupPanel() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const seqRef = useRef(0);

  useEffect(() => {
    const trimmed = q.trim();
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      if (!trimmed) {
        setItems([]);
        return;
      }
      const seq = ++seqRef.current;
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const r = await fetch(`/api/lookup?q=${encodeURIComponent(trimmed)}`, { signal: ctrl.signal });
        const j: Item[] = await r.json();
        if (seq !== seqRef.current) return;
        j.sort((a, b) => {
          if (a.scheme === b.scheme) return 0;
          return a.scheme === 'aat' ? -1 : 1;
        });
        setItems(j);
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') setItems([]);
      } finally {
        if (seq === seqRef.current) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const put = (form: HTMLFormElement, name: string, value: string) => {
    const el = form.querySelector<HTMLInputElement>(`input[name=${name}]`);
    if (el) {
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  const fill = (it: Item) => {
    const form = document.getElementById('classification-form') as HTMLFormElement | null;
    if (!form) return;
    put(form, 'scheme', it.scheme);
    put(form, 'uri', it.uri);
    put(form, 'label', it.label_en || '');
    put(form, 'label_ja', it.label_ja || '');
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const aat = items.filter((i) => i.scheme === 'aat');
  const wd = items.filter((i) => i.scheme === 'wikidata');

  return (
    <div>
      <input className="input" placeholder="Search AAT/Wikidata" value={q} onChange={(e) => setQ(e.target.value)} />
      {loading ? <p className="text-xs text-gray-600 mt-1">Searching…</p> : null}

      <section style={{ marginTop: 10 }}>
        <h4 className="text-sm font-semibold mb-1">AAT</h4>
        <ul className="space-y-1">
          {aat.length === 0 ? <li className="text-xs text-gray-600">No AAT results</li> : null}
          {aat.slice(0, 10).map((it) => (
            <li key={`aat:${it.id}`}>
              <button type="button" className="button secondary" onClick={() => fill(it)}>
                {it.label_en} {it.label_ja ? <span lang="ja">/ {it.label_ja}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 10 }}>
        <h4 className="text-sm font-semibold mb-1">Wikidata</h4>
        <ul className="space-y-1">
          {wd.slice(0, 10).map((it) => (
            <li key={`wd:${it.id}`}>
              <button type="button" className="button secondary" onClick={() => fill(it)}>
                {it.label_en} {it.label_ja ? <span lang="ja">/ {it.label_ja}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
