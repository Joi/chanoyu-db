import { NextRequest, NextResponse } from 'next/server';

type Normalized = {
  scheme: 'aat' | 'wikidata';
  uri: string;
  id: string;
  label_en: string;
  label_ja: string;
  note?: string;
};

async function fetchJSON(url: string, timeoutMs = 5000) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const r = await fetch(url, { cache: 'no-store', headers: { accept: 'application/json' }, signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return null;
    return (await r.json()) as any;
  } catch {
    return null;
  }
}

function normalizeAATLabel(json: any, id: string): { en?: string; ja?: string } {
  try {
    const graph: any[] = Array.isArray(json?.['@graph']) ? json['@graph'] : [];
    const node = graph.find((n) => typeof n?.['@id'] === 'string' && n['@id'].endsWith(id));
    const pref = node?.['http://www.w3.org/2004/02/skos/core#prefLabel'] || [];
    const getLang = (lang: string) => {
      const hit = pref.find((p: any) => p['@language'] === lang) || pref.find((p: any) => (p['@value'] as string)?.length);
      return hit ? String(hit['@value'] || '') : undefined;
    };
    return { en: getLang('en'), ja: getLang('ja') };
  } catch {
    return {};
  }
}

function makeVariants(q: string): string[] {
  const base = q.trim();
  const lower = base.toLowerCase();
  const variants = new Set<string>([base]);
  // Heuristics for tea-related terms
  if (/(natsume|なつめ|棗)/i.test(lower)) {
    ['natsume', '棗', '茶入', 'chaire', 'tea caddy', 'tea caddies'].forEach((v) => variants.add(v));
  }
  if (/(chawan|茶碗)/i.test(lower)) {
    ['chawan', '茶碗', 'tea bowl', 'tea bowls'].forEach((v) => variants.add(v));
  }
  return Array.from(variants);
}

async function fetchAATLabelById(id: string): Promise<{ en?: string; ja?: string }> {
  const uri = `http://vocab.getty.edu/aat/${id}`;
  const json = await fetchJSON(`${uri}.json`, 7000);
  if (!json) return {};
  return normalizeAATLabel(json, id);
}

function curatedFallbacks(q: string): { id: string; uri: string; label_en?: string; label_ja?: string }[] {
  const lower = q.toLowerCase();
  const list: { id: string; uri: string; label_en?: string; label_ja?: string }[] = [];
  if (/(^|\b)(chawan|茶碗)(\b|$)/.test(lower)) {
    list.push({ id: '300266745', uri: 'http://vocab.getty.edu/aat/300266745' });
  }
  if (/(^|\b)(natsume|棗|chaire|茶入)(\b|$)/.test(lower)) {
    // Narrow tea caddy (natsume)
    list.push({ id: '300311054', uri: 'http://vocab.getty.edu/aat/300311054' });
  }
  return list;
}

export async function GET(req: NextRequest) {
  const qRaw = (req.nextUrl.searchParams.get('q') || '').trim();
  const q = qRaw;
  if (!q) return NextResponse.json([]);

  const urlMatch = q.match(/vocab\.getty\.edu\/aat\/(\d+)/i);
  const idMatch = !urlMatch && q.match(/^\s*(\d{6,})\s*$/);
  const aatId = urlMatch?.[1] || idMatch?.[1];
  if (aatId) {
    const uri = `http://vocab.getty.edu/aat/${aatId}`;
    let label_en = '', label_ja = '';
    const json = await fetchJSON(`${uri}.json`);
    if (json) {
      const labels = normalizeAATLabel(json, aatId);
      label_en = labels.en || `AAT ${aatId}`;
      label_ja = labels.ja || label_en;
    }
    const one: Normalized = { scheme: 'aat', uri, id: aatId, label_en, label_ja };
    return NextResponse.json([one]);
  }

  const envAat = process.env.AAT_RECONCILE_URL || '';
  // Prefer AAT-specific endpoints and ignore generic multi-schema reconcile to avoid cross-scheme noise
  const bases = [envAat, 'https://refine.getty.edu/reconcile/aat', 'https://vocab.getty.edu/reconcile/aat']
    .filter(Boolean)
    .map((s) => s.replace(/\/$/, ''));

  const variants = makeVariants(q);
  const seenUris = new Set<string>();
  const aatMerged: Normalized[] = [];

  // Query reconciliation across variants (accept only AAT URIs)
  await Promise.all(
    variants.map(async (term) => {
      for (const base of bases) {
        const rec = await fetchJSON(`${base}?query=${encodeURIComponent(term)}&limit=8`, 7000);
        const list: any[] = Array.isArray(rec?.result) ? rec.result : [];
        for (const r of list) {
          const uri: string = r.id || '';
          if (!uri || !/\/aat\//i.test(uri) || seenUris.has(uri)) continue;
          seenUris.add(uri);
          aatMerged.push({
            scheme: 'aat',
            uri,
            id: (uri || '').replace(/^.*?(\d+)$/i, '$1'),
            label_en: r.name || '',
            label_ja: r.name || '',
            note: r.description || '',
          });
        }
      }
    })
  );

  // If still empty, try Getty Suggest for each variant
  if (!aatMerged.length) {
    await Promise.all(
      variants.map(async (term) => {
        const sug = await fetchJSON(`https://vocab.getty.edu/suggest/aat?q=${encodeURIComponent(term)}&fmt=json`, 7000);
        const rows: any[] = Array.isArray(sug?.[1]) ? sug[1] : [];
        for (const row of rows.slice(0, 8)) {
          const id = String(row?.[0] ?? '');
          const label = String(row?.[1] ?? '');
          const uri = String(row?.[2] ?? (id ? `http://vocab.getty.edu/aat/${id}` : ''));
          if (!uri || seenUris.has(uri)) continue;
          seenUris.add(uri);
          aatMerged.push({ scheme: 'aat', uri, id: id || uri.replace(/^.*?(\d+)$/, '$1'), label_en: label, label_ja: label, note: row?.[3] || '' });
        }
      })
    );
  }

  // Curated fallbacks for critical tea terms (ensures AAT visibility even if endpoints are flaky)
  if (!aatMerged.length) {
    const curated = curatedFallbacks(q);
    for (const c of curated) {
      if (seenUris.has(c.uri)) continue;
      const labels = await fetchAATLabelById(c.id);
      aatMerged.push({
        scheme: 'aat',
        uri: c.uri,
        id: c.id,
        label_en: c.label_en || labels.en || `AAT ${c.id}`,
        label_ja: c.label_ja || labels.ja || c.label_en || `AAT ${c.id}`,
      });
    }
  }

  // Wikidata
  const wdUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=ja&uselang=ja&type=item&limit=8&origin=*&search=${encodeURIComponent(q)}`;
  const wdJson = (await fetchJSON(wdUrl)) ?? { search: [] };
  const wikidata: Normalized[] = (wdJson.search || []).map((r: any) => ({
    scheme: 'wikidata',
    uri: `https://www.wikidata.org/entity/${r.id}`,
    id: r.id,
    label_en: r.label || '',
    label_ja: (r.display && r.display.label && r.display.label.value) || r.label || '',
    note: r.description || '',
  }));

  return NextResponse.json([...aatMerged, ...wikidata]);
}
