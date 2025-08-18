import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  const [objs, meds] = await Promise.all([
    db.from('objects').select('id', { count: 'exact', head: true }),
    db.from('media').select('id', { count: 'exact', head: true }),
  ]);
  console.log('objects_count =', objs.count ?? 0);
  console.log('media_count    =', meds.count ?? 0);

  const { data: recentObjects } = await db
    .from('objects')
    .select('id, token, title, local_number, updated_at')
    .order('updated_at', { ascending: false })
    .limit(5);
  console.log('\nRecent objects:');
  for (const row of recentObjects || []) {
    const mcount = await db.from('media').select('id', { count: 'exact', head: true }).eq('object_id', row.id);
    const msample = await db
      .from('media')
      .select('uri, storage_path, created_at')
      .eq('object_id', row.id)
      .order('sort_order', { ascending: true })
      .limit(2);
    const sampleStr = (msample.data || [])
      .map((m) => (m.storage_path as string | null) || (m.uri as string | null) || '')
      .filter(Boolean)
      .join(', ');
    console.log('-', row.token, row.local_number ?? '', row.title ?? '', row.updated_at, `media=${mcount.count ?? 0}`, sampleStr ? `samples=[${sampleStr}]` : '');
  }

  const { data: recentMedia } = await db
    .from('media')
    .select('id, object_id, uri, storage_path, created_at, sort_order')
    .order('id', { ascending: false })
    .limit(5);
  console.log('\nRecent media:');
  for (const m of recentMedia || []) {
    const ref = (m.storage_path as string | null) || (m.uri as string | null) || '';
    console.log('-', m.id, '→', m.object_id, ref, m.created_at, 'sort=', (m as any).sort_order ?? '');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


