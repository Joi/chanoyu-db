import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin, requireOwner } from '@/lib/auth';
import crypto from 'node:crypto';

function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(plain, salt, 200_000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

async function createMember(formData: FormData) {
  'use server';
  const isAdmin = await requireAdmin();
  if (!isAdmin) return notFound();
  const isOwner = await requireOwner();
  const email = String(formData.get('email') || '').trim();
  let role = String(formData.get('role') || 'guest');
  const full_name_en = String(formData.get('full_name_en') || '').trim() || null;
  const full_name_ja = String(formData.get('full_name_ja') || '').trim() || null;
  const password = String(formData.get('password') || '');
  if (!email || !password) return;
  // Admins can create guests and admins; only owners can create owners
  if (!isOwner && role === 'owner') role = 'admin';
  const db = supabaseAdmin();
  await db.from('accounts').insert({ email, full_name_en, full_name_ja, role, password_hash: hashPassword(password) });
  revalidatePath('/admin/members');
}

export default async function NewMemberPage() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return notFound();
  const isOwner = await requireOwner();

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Add member</h1>
      <form action={createMember} className="grid" style={{ gap: 12 }}>
        <input name="email" className="input" placeholder="email" />
        <select name="role" className="input" defaultValue={isOwner ? 'admin' : 'guest'}>
          <option value="guest">guest</option>
          <option value="admin" disabled={!isOwner}>admin</option>
          <option value="owner" disabled={!isOwner}>owner</option>
        </select>
        <input name="full_name_en" className="input" placeholder="Full name (EN)" />
        <input name="full_name_ja" className="input" placeholder="Full name (JA)" />
        <input name="password" className="input" placeholder="Password" />
        {!isOwner ? <p className="text-xs text-gray-600">As admin, you can create guests only.</p> : null}
        <button className="button" type="submit">Create</button>
      </form>
    </main>
  );
}
