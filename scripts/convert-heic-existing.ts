import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import heicConvert from 'heic-convert';

async function main() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error('Missing Supabase env');
  const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  const sha256Hex = (buf: Buffer): string => {
    const hash = crypto.createHash('sha256');
    hash.update(buf);
    return hash.digest('hex');
  };

  // Find media rows likely pointing to HEIC/HEIF assets
  const { data: rows } = await db
    .from('media')
    .select('id, object_id, uri, storage_path')
    .order('id', { ascending: true })
    .limit(1000);

  for (const m of rows || []) {
    const uri: string = (m as any).uri || '';
    if (!uri) continue;
    const isHeic = /\.heic($|\?)/i.test(uri) || /\.heif($|\?)/i.test(uri) || /image\/heic/i.test(uri) || /image\/heif/i.test(uri);
    if (!isHeic) continue;
    const objectId = (m as any).object_id as string;
    if (!objectId) continue;

    try {
      const r = await fetch(uri);
      if (!r.ok) throw new Error(`fetch ${uri} -> ${r.status}`);
      const ab = await r.arrayBuffer();
      const out = await heicConvert({ buffer: Buffer.from(ab), format: 'JPEG', quality: 0.9 });
      const output = Buffer.from(out);
      const hash = sha256Hex(output).slice(0, 16);
      const fileName = `${objectId}-${hash}.jpeg`;
      const path = `media/${objectId}/${fileName}`;
      // @ts-ignore
      const up = await (db as any).storage.from('media').upload(path, output, { contentType: 'image/jpeg', upsert: false });
      if (up.error && !String(up.error?.message || '').toLowerCase().includes('already exists')) {
        throw up.error;
      }
      // @ts-ignore
      const pub = (db as any).storage.from('media').getPublicUrl(path);
      const publicUrl = pub?.data?.publicUrl as string | undefined;
      if (!publicUrl) throw new Error('no public url');
      await db
        .from('media')
        .update({ uri: publicUrl, bucket: 'media', storage_path: path.replace(/^media\//, '') })
        .eq('id', (m as any).id);
      console.log('converted', (m as any).id, '→', publicUrl);
    } catch (e) {
      console.warn('convert failed', (m as any).id, e);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


