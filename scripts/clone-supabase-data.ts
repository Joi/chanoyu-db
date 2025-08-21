import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type TableSpec = {
  name: string;
  conflict?: string; // column or columns for ON CONFLICT
};

function makeClient(url?: string, key?: string): SupabaseClient {
  if (!url || !key) throw new Error('Missing Supabase URL or key');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function tableExists(db: SupabaseClient, table: string): Promise<boolean> {
  const { data, error } = await db
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', table)
    .limit(1);
  if (error) return false;
  return Array.isArray(data) && data.length > 0;
}

async function fetchAllRows(db: SupabaseClient, table: string, pageSize = 1000): Promise<any[]> {
  const rows: any[] = [];
  let from = 0;
  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await db.from(table).select('*').range(from, to);
    if (error) throw error;
    const batch = data || [];
    rows.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

async function upsertRows(db: SupabaseClient, table: string, rows: any[], conflict?: string) {
  if (!rows.length) return;
  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const q = db.from(table).upsert(chunk, conflict ? { onConflict: conflict, ignoreDuplicates: false } : undefined);
    const { error } = await q;
    if (error) throw error;
  }
}

async function main() {
  const SOURCE_URL = process.env.SOURCE_SUPABASE_URL || '';
  const SOURCE_KEY = process.env.SOURCE_SUPABASE_SERVICE_ROLE_KEY || '';
  const DEST_URL = process.env.DEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const DEST_KEY = process.env.DEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const COPY_ACCOUNTS = String(process.env.SOURCE_COPY_ACCOUNTS || '').toLowerCase() === 'true';

  if (!SOURCE_URL || !SOURCE_KEY || !DEST_URL || !DEST_KEY) {
    console.error('Missing env. Required: SOURCE_SUPABASE_URL, SOURCE_SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL (or DEST_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY (or DEST_SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
  }

  const src = makeClient(SOURCE_URL, SOURCE_KEY);
  const dst = makeClient(DEST_URL, DEST_KEY);

  const specs: TableSpec[] = [
    COPY_ACCOUNTS ? { name: 'accounts', conflict: 'id' } : null,
    { name: 'licenses', conflict: 'id' },
    { name: 'classifications', conflict: 'id' },
    { name: 'local_classes', conflict: 'id' },
    { name: 'local_class_hierarchy', conflict: 'ancestor_id,descendant_id' },
    { name: 'local_class_links', conflict: 'local_class_id,classification_id' },
    { name: 'locations', conflict: 'id' },
    { name: 'objects', conflict: 'id' },
    { name: 'media', conflict: 'id' },
    { name: 'object_media_links', conflict: 'object_id,media_id' },
    { name: 'location_media_links', conflict: 'location_id,media_id' },
    { name: 'object_classifications', conflict: 'object_id,classification_id,role' },
    { name: 'chakai', conflict: 'id' },
    { name: 'chakai_items', conflict: 'chakai_id,object_id' },
  ].filter(Boolean) as TableSpec[];

  for (const spec of specs) {
    const existsSrc = await tableExists(src, spec.name);
    const existsDst = await tableExists(dst, spec.name);
    if (!existsSrc || !existsDst) {
      console.log(`- skip ${spec.name}: existsSrc=${existsSrc} existsDst=${existsDst}`);
      continue;
    }
    console.log(`Copying ${spec.name} ...`);
    const rows = await fetchAllRows(src, spec.name);
    if (!rows.length) {
      console.log(`- ${spec.name}: 0 rows`);
      continue;
    }
    // Preserve ids and foreign keys as-is
    await upsertRows(dst, spec.name, rows, spec.conflict);
    console.log(`- ${spec.name}: upserted ${rows.length}`);
  }

  console.log('Clone complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


