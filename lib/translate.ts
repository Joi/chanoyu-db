export async function translateText(
  text: string,
  targetLang: 'en' | 'ja',
  sourceLang?: 'en' | 'ja'
): Promise<string | null> {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!key || !text.trim()) return null;
  const params = new URLSearchParams();
  params.set('q', text);
  params.set('target', targetLang);
  if (sourceLang) params.set('source', sourceLang);
  params.set('format', 'text');
  params.set('key', key);

  const url = `https://translation.googleapis.com/language/translate/v2?${params.toString()}`;
  try {
    const r = await fetch(url, { method: 'POST' });
    if (!r.ok) return null;
    const j = (await r.json()) as any;
    const translated = j?.data?.translations?.[0]?.translatedText;
    return typeof translated === 'string' ? translated : null;
  } catch {
    return null;
  }
}
