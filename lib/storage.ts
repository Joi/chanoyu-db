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

export function makeSupabaseThumbUrl(publicUrl: string): string | null {
  try {
    const u = new URL(publicUrl);
    const parts = u.pathname.split('/').filter(Boolean);
    const idx = parts.findIndex((p) => p === 'public');
    if (idx < 0 || !parts[idx + 1]) return null;
    const bucket = parts[idx + 1];
    const pathParts = parts.slice(idx + 2);
    if (pathParts.length === 0) return null;
    const file = pathParts[pathParts.length - 1];
    const folderParts = pathParts.slice(0, -1);
    const newFile = `thumb_${file}`;
    const newPath = [...folderParts, newFile].join('/');
    u.pathname = `/${[...parts.slice(0, idx + 2), newPath].join('/')}`;
    return u.toString();
  } catch {
    return null;
  }
}
