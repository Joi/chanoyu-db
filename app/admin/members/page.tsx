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

// Note: Editing moved to detail page. This listing is read-only except for delete.

export default async function MembersPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return notFound();
  const isOwner = await requireOwner();
  const db = supabaseAdmin();
  const { data } = await db
    .from('accounts')
    .select('id,email,full_name_en,full_name_ja,role,created_at,tea_school_id, tea_school:tea_schools(name_en,name_ja)')
    .order('created_at', { ascending: false });

  const deleted = typeof searchParams?.deleted === 'string' ? searchParams!.deleted : undefined;
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Members</h1>
      <p className="text-sm mb-4"><a className="underline" href="/admin/members/new">Add member</a></p>
      {deleted ? (
        <div className="card" style={{ background: '#fff7ed', borderColor: '#fed7aa', marginBottom: 12 }}>Deleted {deleted}</div>
      ) : null}

      <section className="card">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Role</th>
                <th className="text-left p-2">Name (EN)</th>
                <th className="text-left p-2">Name (JA)</th>
                <th className="text-left p-2">Tea school</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((u: any) => {
                // Allow admins to manage guests and admins; only block owner rows for non-owner
                const adminEditingDisallowed = !isOwner && u.role === 'owner';
                return (
                  <tr key={u.id}>
                    <td className="p-2" style={{ minWidth: 220 }}>{u.email}</td>
                    <td className="p-2" style={{ minWidth: 140 }}>{u.role}</td>
                    <td className="p-2" style={{ minWidth: 180 }}>{u.full_name_en || '—'}</td>
                    <td className="p-2" style={{ minWidth: 180 }}>{u.full_name_ja || '—'}</td>
                    <td className="p-2" style={{ minWidth: 200 }}>{u.tea_school?.name_en ? `${u.tea_school.name_en}${u.tea_school?.name_ja ? ' / ' + u.tea_school.name_ja : ''}` : '—'}</td>
                    <td className="p-2" style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <a className="button secondary small" href={`/admin/members/${u.id}`}>Edit</a>
                        <form action={deleteMember}>
                          <input type="hidden" name="id" value={u.id} />
                          <input type="hidden" name="role" value={u.role} />
                          <button className="button danger small" type="submit" disabled={adminEditingDisallowed}>Delete</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!isOwner ? <p className="text-xs text-gray-600 mt-2">Signed in as admin — you can manage guests and admins. Sign in as owner to manage owners.</p> : null}
      </section>
    </main>
  );
}
