// Utilities to resolve AAT preferred labels (EN/JA)

async function fetchJSON(url: string, timeoutMs = 7000): Promise<any | null> {
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

export async function fetchAATPreferredLabels(idOrUri: string): Promise<{ en?: string; ja?: string }> {
  const id = idOrUri.replace(/^.*?(\d+)$/, '$1');
  if (!id) return {};
  const uri = `http://vocab.getty.edu/aat/${id}`;
  const json = await fetchJSON(`${uri}.json`, 7000);
  if (!json) return {};
  return normalizeAATLabel(json, id);
}


