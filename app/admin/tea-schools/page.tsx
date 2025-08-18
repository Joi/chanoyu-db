import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { prepareTeaSchoolPayload } from '@/lib/teaSchools';

async function createSchool(formData: FormData) {
  'use server';
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const name_en = String(formData.get('name_en') || '').trim() || null;
  const name_ja = String(formData.get('name_ja') || '').trim() || null;
  const prepared = prepareTeaSchoolPayload({ nameEn: name_en, nameJa: name_ja });
  if (prepared.error === 'missing_name') {
    return redirect('/admin/tea-schools?error=missing_name');
  }
  if (prepared.error === 'too_long') {
    return redirect('/admin/tea-schools?error=too_long');
  }
  const db = supabaseAdmin();
  const { error } = await db.from('tea_schools').insert(prepared.payload!);
  if (error) {
    console.error('[tea-schools] insert error:', error.message);
    return redirect('/admin/tea-schools?error=insert_failed');
  }
  revalidatePath('/admin/tea-schools');
  redirect('/admin/tea-schools?added=1');
}

export const dynamic = 'force-dynamic';

export default async function TeaSchoolsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const db = supabaseAdmin();
  const { data } = await db
    .from('tea_schools')
    .select('id, name_en, name_ja')
    .order('name_en', { ascending: true })
    .order('name_ja', { ascending: true });
  const schools = data || [];
  return (
    <main className="container">
      <h1>Tea Schools</h1>
      {searchParams?.added ? (
        <div className="card" style={{ background: '#f0fff4', borderColor: '#bbf7d0', marginBottom: 12 }}>Added</div>
      ) : null}
      {searchParams?.error === 'missing_name' ? (
        <div className="card" style={{ background: '#fef2f2', borderColor: '#fecaca', marginBottom: 12 }}>Please enter a name in EN or JA.</div>
      ) : null}
      {searchParams?.error === 'too_long' ? (
        <div className="card" style={{ background: '#fef2f2', borderColor: '#fecaca', marginBottom: 12 }}>Name is too long. Please shorten it.</div>
      ) : null}

      <form action={createSchool} className="card grid" style={{ gap: 8, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input name="name_en" className="input" placeholder="Name (EN)" />
          <input name="name_ja" className="input" placeholder="Name (JA)" />
        </div>
        <div><button className="button" type="submit">Add School</button></div>
      </form>

      <section className="card">
        <table className="table">
          <colgroup>
            <col style={{ width: '100%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Name (EN/JA)</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((s: any) => (
              <tr key={s.id}>
                <td>
                  <div className="truncate" title={`${s.name_en || ''}${s.name_ja ? ' / ' + s.name_ja : ''}`}>
                    <div><strong>{s.name_en || s.name_ja}</strong></div>
                    {s.name_en && s.name_ja ? <div className="muted" lang="ja">{s.name_ja}</div> : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}


