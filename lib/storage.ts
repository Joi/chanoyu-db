export function parseSupabasePublicUrl(url: string): { bucket: string; path: string } | null {
  try {
    const u = new URL(url);
    // Expected: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const parts = u.pathname.split('/').filter(Boolean);
    const idx = parts.findIndex((p) => p === 'public');
    if (idx >= 0 && parts[idx + 1]) {
      const bucket = parts[idx + 1];
      const path = parts.slice(idx + 2).join('/');
      if (bucket && path) return { bucket, path };
    }
    return null;
  } catch {
    return null;
  }
}
