import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin, requireOwner } from '@/lib/auth';
import crypto from 'node:crypto';

function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(plain, salt, 200_000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

async function updateAction(formData: FormData) {
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
  if (!id) return notFound();
  // Admins can manage guests and admins; only owners may manage owners
  if (!isOwner && current_role === 'owner') return notFound();
  if (!isOwner && role === 'owner') role = 'admin';
  const db = supabaseAdmin();
  const tea_school_id_raw = String(formData.get('tea_school_id') || '').trim();
  const tea_school_id = tea_school_id_raw || null;
  const patch: any = { email, full_name_en, full_name_ja, role, tea_school_id };
  if (password) patch.password_hash = hashPassword(password);
  await db.from('accounts').update(patch).eq('id', id);
  revalidatePath(`/admin/members/${id}`);
  redirect(`/admin/members/${id}?saved=1`);
}

export default async function MemberDetail({ params, searchParams }: { params: { id: string }, searchParams?: { [key: string]: string | string[] | undefined } }) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return notFound();
  const isOwner = await requireOwner();
  const db = supabaseAdmin();
  const [{ data: acct }, { data: schools }] = await Promise.all([
    db
      .from('accounts')
      .select('id,email,full_name_en,full_name_ja,role,created_at,tea_school_id')
      .eq('id', params.id)
      .maybeSingle(),
    db
      .from('tea_schools')
      .select('id,name_en,name_ja')
      .order('name_en'),
  ]);
  const data = acct || null;
  if (!data) return notFound();

  const saved = typeof searchParams?.saved === 'string' ? searchParams!.saved : undefined;
  return (
    <main className="max-w-lg mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Member</h1>
      {saved ? <div className="card" style={{ background: '#f0fff4', borderColor: '#bbf7d0', marginBottom: 12 }}>Saved</div> : null}
      <form action={updateAction} className="card grid" style={{ gap: 12 }}>
        <input type="hidden" name="id" value={data.id} />
        <input type="hidden" name="current_role" value={data.role} />
        <label className="label">Email</label>
        <input name="email" className="input" defaultValue={data.email} />
        <label className="label">Role</label>
        <select name="role" className="input" defaultValue={data.role}>
          <option value="guest">guest</option>
          <option value="admin">admin</option>
          <option value="owner" disabled={!isOwner}>owner</option>
        </select>
        <label className="label">Name (EN)</label>
        <input name="full_name_en" className="input" defaultValue={data.full_name_en || ''} />
        <label className="label">Name (JA)</label>
        <input name="full_name_ja" className="input" defaultValue={data.full_name_ja || ''} />
        <label className="label">Tea school</label>
        <select name="tea_school_id" className="input" defaultValue={(data as any).tea_school_id || ''}>
          <option value="">(none)</option>
          {((schools as any[]) || []).map((s) => (
            <option key={(s as any).id} value={(s as any).id}>{(s as any).name_en}{(s as any).name_ja ? ` / ${(s as any).name_ja}` : ''}</option>
          ))}
        </select>
        <label className="label">Set new password (optional)</label>
        <input name="password" className="input" placeholder="New password" />
        <div>
          <button className="button" type="submit">Save</button>
          <a className="underline text-sm" href="/admin/members" style={{ marginLeft: 8 }}>Cancel</a>
        </div>
      </form>
      <p className="mt-4"><a className="underline" href="/admin/members">Back to members</a></p>
      {!isOwner ? <p className="text-xs text-gray-600 mt-2">As admin, you can manage guests and admins. Only owners can manage owners.</p> : null}
    </main>
  );
}


