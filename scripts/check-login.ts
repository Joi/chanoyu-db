import 'dotenv/config';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

function verifyPassword(plain: string, stored: string): boolean {
  const [salt, hex] = (stored || '').split(':');
  if (!salt || !hex) return false;
  const calc = crypto.pbkdf2Sync(plain, salt, 200_000, 32, 'sha256');
  try {
    return crypto.timingSafeEqual(Buffer.from(hex, 'hex'), calc);
  } catch {
    return false;
  }
}

async function main() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
    process.exit(1);
  }

  const email = process.argv[2];
  const password = process.argv[3] || '';
  if (!email || !password) {
    console.error('Usage: pnpm exec ts-node scripts/check-login.ts <email> <password>');
    process.exit(1);
  }

  const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: acct, error } = await db
    .from('accounts')
    .select('id, email, role, password_hash')
    .eq('email', email)
    .maybeSingle();
  if (error) {
    console.error('DB error:', error.message || error);
    process.exit(1);
  }
  if (!acct) {
    console.error('No account found for email');
    process.exit(2);
  }
  const ok = verifyPassword(password, String((acct as any).password_hash || ''));
  console.log(JSON.stringify({ ok, id: (acct as any).id, role: (acct as any).role }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });


