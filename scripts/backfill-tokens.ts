import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { customAlphabet } from 'nanoid';

const alphabet = '0123456789bcdfghjkmnpqrstvwxz';
const mintToken = (len = 12) => customAlphabet(alphabet, len)();

async function ensureEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function backfillTokens(db: any, table: string) {
  console.log(`[backfill] ${table}: start`);
  // Fetch IDs missing token
  const { data: rows, error } = await db
    .from(table)
    .select('id, token')
    .is('token', null)
    .limit(10000);
  if (error) {
    console.error(`[backfill] ${table}: query error`, (error as any).message || error);
    return;
  }
  const list = Array.isArray(rows) ? (rows as any[]) : [];
  if (!list.length) {
    console.log(`[backfill] ${table}: nothing to do`);
    return;
  }
  for (const row of list) {
    const token = mintToken(12);
    const { error: eUpd } = await db.from(table).update({ token }).eq('id', row.id);
    if (eUpd) console.error(`[backfill] ${table}: update failed for ${row.id}`, eUpd.message || eUpd);
  }
  console.log(`[backfill] ${table}: backfilled ${list.length} tokens`);
}

async function main() {
  const db = await ensureEnv();
  await backfillTokens(db, 'locations');
  await backfillTokens(db, 'media');
  await backfillTokens(db, 'chakai');
  console.log('[backfill] done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


