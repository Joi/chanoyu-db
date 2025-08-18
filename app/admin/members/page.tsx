import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin, requireOwner } from '@/lib/auth';

// no-op hashing here; listing page does not handle password updates

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

export const dynamic = 'force-dynamic';

export default async function MembersPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return redirect('/login');
  const isOwner = await requireOwner();
  const db = supabaseAdmin();
  const [{ data, error: eAcc }, { data: schools, error: eSch }] = await Promise.all([
    db
    .from('accounts')
    .select('id,email,full_name_en,full_name_ja,tea_school_id,role,created_at')
    .order('created_at', { ascending: false }),
    db.from('tea_schools').select('id,name_en,name_ja'),
  ]);
  const schoolById: Record<string, { name_en?: string | null; name_ja?: string | null }> = {};
  for (const s of (schools as any[]) || []) {
    schoolById[(s as any).id] = { name_en: (s as any).name_en, name_ja: (s as any).name_ja };
  }

  const deleted = typeof searchParams?.deleted === 'string' ? searchParams!.deleted : undefined;
  return (
    <main className="container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h1>Members</h1>
        <Link href="/admin/members/new" className="button small secondary">Add member</Link>
      </div>
      {deleted ? (
        <div className="card" style={{ background: '#fff7ed', borderColor: '#fed7aa', marginBottom: 12 }}>Deleted {deleted}</div>
      ) : null}

      <section className="card">
        <table className="table">
          <colgroup>
            <col style={{ width: '260px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '240px' }} />
            <col style={{ width: '180px' }} />
            <col style={{ width: '190px' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Name</th>
              <th>Tea school</th>
              <th className="actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((u: any) => {
              const adminEditingDisallowed = !isOwner && u.role === 'owner';
              const teaSchoolLabel = u.tea_school_id && schoolById[u.tea_school_id]
                ? (schoolById[u.tea_school_id].name_en || schoolById[u.tea_school_id].name_ja || '—')
                : '—';
              return (
                <tr key={u.id}>
                  <td><div className="truncate" title={u.email}>{u.email}</div></td>
                  <td>{u.role}</td>
                  <td>
                    <div className="truncate" title={`${u.full_name_en || ''}${u.full_name_ja ? ' / ' + u.full_name_ja : ''}`}>
                      <div>{u.full_name_en || '—'}</div>
                      <div className="muted" lang="ja">{u.full_name_ja || '—'}</div>
                    </div>
                  </td>
                  <td><div className="truncate" title={teaSchoolLabel}>{teaSchoolLabel}</div></td>
                  <td className="actions">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 96px)', gap: 8, justifyContent: 'end' }}>
                      <Link href={`/admin/members/${u.id}`} className="button small secondary">Edit</Link>
                      <form action={deleteMember}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="role" value={u.role} />
                        <button className="button small danger" type="submit" disabled={adminEditingDisallowed} aria-disabled={adminEditingDisallowed}>Delete</button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!isOwner ? <p className="muted" style={{ marginTop: 8 }}>Signed in as admin — you can manage guests and admins. Sign in as owner to manage owners.</p> : null}
      </section>
    </main>
  );
}
