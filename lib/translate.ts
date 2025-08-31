export async function translateText(
  text: string,
  targetLang: 'en' | 'ja',
  sourceLang?: 'en' | 'ja'
): Promise<string | null> {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!key) {
    console.log('[translateText] missing GOOGLE_TRANSLATE_API_KEY');
    return null;
  }
  if (!text.trim()) {
    console.log('[translateText] empty text');
    return null;
  }
  const params = new URLSearchParams();
  params.set('q', text);
  params.set('target', targetLang);
  if (sourceLang) params.set('source', sourceLang);
  params.set('format', 'text');
  params.set('key', key);

  const url = `https://translation.googleapis.com/language/translate/v2?${params.toString()}`;
  try {
    console.log('[translateText] request', { targetLang, sourceLang });
    const r = await fetch(url, { method: 'POST' });
    if (!r.ok) {
      const body = await r.text().catch(() => '');
      console.log('[translateText] response not ok', { status: r.status, body: body.slice(0, 500) });
      return null;
    }
    const j = (await r.json()) as any;
    const translated = j?.data?.translations?.[0]?.translatedText;
    return typeof translated === 'string' ? translated : null;
  } catch {
    console.log('[translateText] fetch error');
    return null;
  }
}

// Validate a next path for login redirects. Allow only same-origin paths starting with '/'.
export function validateNextPath(input: string | null | undefined): string | null {
  if (!input) return null;
  if (!input.startsWith('/')) return null;
  try {
    const url = new URL(input, 'http://localhost');
    if (url.origin !== 'http://localhost') return null;
    if (!url.pathname.startsWith('/')) return null;
    return url.pathname + (url.search || '') + (url.hash || '');
  } catch {
    return null;
  }
}
