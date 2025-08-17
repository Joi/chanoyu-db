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

async function deleteMember(formData: FormData) {
  'use server';
  const isAdmin = await requireAdmin();
  if (!isAdmin) return notFound();
  const isOwner = await requireOwner();
  const id = String(formData.get('id') || '');
  const role = String(formData.get('role') || 'guest');
  if (!id) return;
  if (!isOwner && role !== 'guest') return;
  const db = supabaseAdmin();
  await db.from('accounts').delete().eq('id', id);
  revalidatePath('/admin/members');
}

async function updateMember(formData: FormData) {
  'use server';
  const isAdmin = await requireAdmin();
  if (!isAdmin) return notFound();
  const isOwner = await requireOwner();
  const id = String(formData.get('id') || '');
  const email = String(formData.get('email') || '').trim();
  let role = String(formData.get('role') || 'guest');
  const full_name_en = String(formData.get('full_name_en') || '').trim() || null;
  const full_name_ja = String(formData.get('full_name_ja') || '').trim() || null;
  const current_role = String(formData.get('current_role') || 'guest');
  const password = String(formData.get('password') || '');
  if (!id) return;
  if (!isOwner) {
    if (current_role !== 'guest') return;
    role = 'guest';
  }
  const db = supabaseAdmin();
  const patch: any = { email, full_name_en, full_name_ja, role };
  if (password) patch.password_hash = hashPassword(password);
  await db.from('accounts').update(patch).eq('id', id);
  revalidatePath('/admin/members');
}

export default async function MembersPage() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return notFound();
  const isOwner = await requireOwner();
  const db = supabaseAdmin();
  const { data } = await db
    .from('accounts')
    .select('id,email,full_name_en,full_name_ja,role,created_at')
    .order('created_at', { ascending: false });

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Members</h1>
      <p className="text-sm mb-4"><a className="underline" href="/admin/members/new">Add member</a></p>

      <section className="space-y-3">
        {(data ?? []).map((u: any) => {
          const adminEditingDisallowed = !isOwner && u.role !== 'guest';
          return (
            <div key={u.id} className="card">
              <form action={updateMember} className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="current_role" value={u.role} />
                <input name="email" className="input" defaultValue={u.email} disabled={adminEditingDisallowed} />
                <select name="role" className="input" defaultValue={u.role} disabled={adminEditingDisallowed}>
                  <option value="guest">guest</option>
                  <option value="admin" disabled={!isOwner}>admin</option>
                  <option value="owner" disabled={!isOwner}>owner</option>
                </select>
                <input name="full_name_en" className="input" defaultValue={u.full_name_en || ''} disabled={adminEditingDisallowed} />
                <input name="full_name_ja" className="input" defaultValue={u.full_name_ja || ''} disabled={adminEditingDisallowed} />
                <input name="password" className="input" placeholder="Set new password (optional)" disabled={adminEditingDisallowed} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="button" type="submit" disabled={adminEditingDisallowed}>Save</button>
                </div>
              </form>
              <form action={deleteMember} className="mt-2">
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="role" value={u.role} />
                <button className="text-red-600 text-sm" type="submit" disabled={adminEditingDisallowed}>Delete</button>
              </form>
            </div>
          );
        })}
      </section>
    </main>
  );
}
