import { config } from 'dotenv';
// Load base .env then override with .env.local if present
config();
config({ path: '.env.local', override: true });
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(plain, salt, 200_000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
    process.exit(1);
  }

  const email = process.env.OWNER_EMAIL || process.argv[2];
  const password = process.env.OWNER_PASSWORD || process.argv[3];
  if (!email || !password) {
    console.error('Usage: OWNER_EMAIL=... OWNER_PASSWORD=... ts-node scripts/seed-owner.ts');
    console.error('   or: ts-node scripts/seed-owner.ts <email> <password>');
    process.exit(1);
  }

  const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: existing, error: findErr } = await db.from('accounts').select('id, role').eq('email', email).maybeSingle();
  if (findErr) {
    console.error('Lookup failed:', findErr.message || findErr);
    process.exit(1);
  }

  if (existing) {
    console.log(`Account already exists for ${email} (role=${existing.role}). Updating password...`);
    const password_hash = hashPassword(password);
    const { error: updErr } = await db.from('accounts').update({ password_hash }).eq('id', existing.id);
    if (updErr) {
      console.error('Update failed:', updErr.message || updErr);
      process.exit(1);
    }
    console.log('Password updated.');
    return;
  }

  const password_hash = hashPassword(password);
  const { error: insErr } = await db.from('accounts').insert({ email, role: 'owner', password_hash });
  if (insErr) {
    console.error('Insert failed:', insErr.message || insErr);
    process.exit(1);
  }
  console.log(`Owner account created for ${email}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


