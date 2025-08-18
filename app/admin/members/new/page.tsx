import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import crypto from 'node:crypto';

function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(plain, salt, 200_000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

async function createMember(formData: FormData) {
  'use server';
  const ok = await requireAdmin();
  if (!ok) return notFound();
  const email = String(formData.get('email') || '').trim();
  const role = String(formData.get('role') || 'guest');
  const full_name_en = String(formData.get('full_name_en') || '').trim() || null;
  const full_name_ja = String(formData.get('full_name_ja') || '').trim() || null;
  const tea_school_id_raw = String(formData.get('tea_school_id') || '').trim();
  const tea_school_id = tea_school_id_raw || null;
  const password = String(formData.get('password') || '');
  if (!email || !password) return;
  const db = supabaseAdmin();
  await db.from('accounts').insert({
    email,
    role,
    full_name_en,
    full_name_ja,
    tea_school_id,
    password_hash: hashPassword(password),
  });
  revalidatePath('/admin/members');
  redirect('/admin/members');
}

export default async function NewMemberPage() {
  const ok = await requireAdmin();
  if (!ok) return notFound();
  const db = supabaseAdmin();
  const { data: schools } = await db.from('tea_schools').select('id,name_en,name_ja').order('name_en');
  return (
    <main className="max-w-lg mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Add member</h1>
      <form action={createMember} className="card grid" style={{ gap: 12 }}>
        <label className="label">Email</label>
        <input name="email" className="input" required />
        <label className="label">Role</label>
        <select name="role" className="input" defaultValue="guest">
          <option value="guest">guest</option>
          <option value="admin">admin</option>
          <option value="owner" disabled>owner</option>
        </select>
        <label className="label">Name (EN)</label>
        <input name="full_name_en" className="input" />
        <label className="label">Name (JA)</label>
        <input name="full_name_ja" className="input" />
        <label className="label">Tea school</label>
        <select name="tea_school_id" className="input" defaultValue="">
          <option value="">(none)</option>
          {(schools || []).map((s: any) => (
            <option key={s.id} value={s.id}>{s.name_en}{s.name_ja ? ` / ${s.name_ja}` : ''}</option>
          ))}
        </select>
        <label className="label">Password</label>
        <input name="password" type="password" className="input" required />
        <div>
          <button className="button" type="submit">Create</button>
          <a className="underline text-sm" href="/admin/members" style={{ marginLeft: 8 }}>Cancel</a>
        </div>
      </form>
    </main>
  );
}
