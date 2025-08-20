import 'dotenv/config';
import { supabaseAdmin } from '../lib/supabase/server';

async function removePrefix(db: any, bucket: string, folder: string): Promise<number> {
  let removed = 0;
  // List entries in this folder
  const res = await db.storage.from(bucket).list(folder, { limit: 1000, offset: 0, search: '' });
  if ((res as any)?.error) throw (res as any).error;
  const entries: Array<{ name: string; id?: string; metadata?: any }>|undefined = (res as any)?.data;
  if (!Array.isArray(entries) || entries.length === 0) return 0;
  for (const it of entries) {
    const child = `${folder}/${it.name}`.replace(/\/+/, '/');
    const isFile = !!(it as any)?.metadata; // heuristic: folders have null metadata
    if (isFile) {
      const del = await db.storage.from(bucket).remove([child]);
      if ((del as any)?.error) throw (del as any).error;
      removed += 1;
      // Also try to remove a possible "thumb_" peer file in the same folder
      if (!it.name.startsWith('thumb_')) {
        const thumb = `${folder}/thumb_${it.name}`;
        await db.storage.from(bucket).remove([thumb]);
      }
    } else {
      removed += await removePrefix(db, bucket, child);
      // After recursive cleanup, attempt removing any empty markers (noop in Supabase)
    }
  }
  return removed;
}

async function main() {
  const db = supabaseAdmin();
  const bucket = 'media';
  const base = 'media/location';
  const count = await removePrefix(db as any, bucket, base);
  console.log(`Removed ${count} objects under ${base}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


