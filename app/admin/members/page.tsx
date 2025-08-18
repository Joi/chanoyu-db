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
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Members</h1>
      <p className="text-sm mb-4"><a className="underline" href="/admin/members/new">Add member</a></p>
      {deleted ? (
        <div className="card" style={{ background: '#fff7ed', borderColor: '#fed7aa', marginBottom: 12 }}>Deleted {deleted}</div>
      ) : null}

      <section className="card">
        <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 8 }}>
          {(data ?? []).map((u: any) => {
            const adminEditingDisallowed = !isOwner && u.role === 'owner';
            return (
              <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 2fr 2fr 1fr 210px', gap: 10, alignItems: 'center', borderBottom: '1px solid var(--border-gray)', padding: '10px 12px' }}>
                <div className="text-sm" style={{ minWidth: 220 }}>{u.email}</div>
                <div className="text-sm" style={{ minWidth: 100 }}>{u.role}</div>
                <div className="text-sm" style={{ minWidth: 160 }}>{u.full_name_en || '—'}</div>
                <div className="text-sm" style={{ minWidth: 160 }} lang="ja">{u.full_name_ja || '—'}</div>
                <div className="text-xs text-gray-600" style={{ minWidth: 160 }}>
                  {u.tea_school_id && schoolById[u.tea_school_id]
                    ? (schoolById[u.tea_school_id].name_en || schoolById[u.tea_school_id].name_ja || '—')
                    : '—'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 96px)', gap: 8, justifyContent: 'end', width: '210px' }}>
                  <Link href={`/admin/members/${u.id}`} className="button small secondary">Edit</Link>
                  <form action={deleteMember}>
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="role" value={u.role} />
                    <button className="button small danger" type="submit" disabled={adminEditingDisallowed} aria-disabled={adminEditingDisallowed}>Delete</button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
        {!isOwner ? <p className="text-xs text-gray-600 mt-2">Signed in as admin — you can manage guests and admins. Sign in as owner to manage owners.</p> : null}
      </section>
    </main>
  );
}
