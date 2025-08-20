import 'dotenv/config';
import { supabaseAdmin } from '../lib/supabase/server';
import { parseSupabasePublicUrl } from '../lib/storage';

async function moveObject(db: any, bucket: string, fromPath: string, toPath: string): Promise<void> {
  // Prefer native move; fallback to copy+remove if move is unavailable in this runtime
  if (typeof db.storage.from(bucket).move === 'function') {
    const res = await db.storage.from(bucket).move(fromPath, toPath);
    if ((res as any)?.error) throw (res as any).error;
    return;
  }
  const dl = await db.storage.from(bucket).download(fromPath);
  if ((dl as any)?.error) throw (dl as any).error;
  const file = (dl as any)?.data as Blob | Buffer;
  const up = await db.storage.from(bucket).upload(toPath, file, { upsert: true });
  if ((up as any)?.error) throw (up as any).error;
  await db.storage.from(bucket).remove([fromPath]);
}

function deriveNewPath(oldPath: string): string | null {
  // Cases we handle:
  // 1) location/<id>/<file>           -> media/<id>/<file>
  // 2) media/location/<id>/<file>     -> media/<id>/<file>
  if (oldPath.startsWith('media/location/')) return oldPath.replace(/^media\/location\//, 'media/');
  if (oldPath.startsWith('location/')) return oldPath.replace(/^location\//, 'media/');
  return null;
}

async function main() {
  const db = supabaseAdmin();

  // Find media rows whose public URL path includes '/location/' inside the media bucket
  const { data: rows, error } = await db
    .from('media')
    .select('id, uri, storage_path')
    .ilike('uri', '%/storage/v1/object/public/media/%/location/%');
  if (error) throw error;

  const targets = (rows || []).filter((r: any) => !!r.uri);
  if (!targets.length) {
    console.log('No legacy media under location/ found.');
    return;
  }

  for (const m of targets) {
    const parsed = parseSupabasePublicUrl(m.uri as string);
    if (!parsed) continue;
    const { bucket, path: oldPath } = parsed;
    const newPath = deriveNewPath(oldPath);
    if (!newPath || newPath === oldPath) continue;

    console.log(`Moving ${oldPath} -> ${newPath}`);
    try {
      await moveObject(db as any, bucket, oldPath, newPath);
    } catch (e: any) {
      console.error('move error', e?.message || e);
      continue;
    }

    // Attempt to move a thumb variant if present: same folder, file name prefixed with thumb_
    const parts = oldPath.split('/');
    const file = parts.pop() as string;
    const folder = parts.join('/');
    const thumbOld = `${folder}/thumb_${file}`;
    const newFolder = newPath.split('/').slice(0, -1).join('/');
    const thumbNew = `${newFolder}/thumb_${file}`;
    try {
      // Try move; ignore not-found errors
      await moveObject(db as any, bucket, thumbOld, thumbNew);
    } catch {}

    // Build new public URL and update DB row
    // @ts-ignore
    const pub = (db as any).storage.from(bucket).getPublicUrl(newPath);
    const newUri = pub?.data?.publicUrl as string | undefined;
    if (!newUri) {
      console.warn('public url missing after move for', m.id);
      continue;
    }
    const upd = await db
      .from('media')
      .update({ uri: newUri, storage_path: newPath })
      .eq('id', m.id);
    if (upd.error) {
      console.error('db update error', upd.error.message || upd.error);
    } else {
      console.log('updated media row', m.id);
    }
  }

  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


