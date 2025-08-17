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
  const { data, error, count } = await db
    .from('accounts')
    .select('email, role', { count: 'exact' })
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error querying accounts:', error.message || error);
    process.exit(1);
  }
  console.log('accounts_count=', count ?? (data?.length || 0));
  console.log('accounts=');
  for (const row of data || []) {
    console.log(`- ${row.email} (${row.role})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


