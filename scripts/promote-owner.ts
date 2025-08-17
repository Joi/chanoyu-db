import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const email = process.env.OWNER_EMAIL || process.argv[2];
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  if (!email) {
    console.error('Usage: OWNER_EMAIL=you@example.com ts-node scripts/promote-owner.ts');
    console.error('   or: ts-node scripts/promote-owner.ts you@example.com');
    process.exit(1);
  }

  const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: acct, error: findErr } = await db
    .from('accounts')
    .select('id, email, role')
    .eq('email', email)
    .maybeSingle();
  if (findErr) {
    console.error('Lookup failed:', findErr.message || findErr);
    process.exit(1);
  }
  if (!acct) {
    console.error('No account found for', email);
    process.exit(1);
  }
  if (acct.role === 'owner') {
    console.log(email, 'is already an owner.');
    return;
  }
  const { error: updErr } = await db.from('accounts').update({ role: 'owner' }).eq('id', acct.id);
  if (updErr) {
    console.error('Update failed:', updErr.message || updErr);
    process.exit(1);
  }
  console.log('Promoted', email, 'to owner.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


