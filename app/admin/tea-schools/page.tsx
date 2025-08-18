import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

async function createSchool(formData: FormData) {
  'use server';
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const name_en = String(formData.get('name_en') || '').trim() || null;
  const name_ja = String(formData.get('name_ja') || '').trim() || null;
  const code = String(formData.get('code') || '').trim() || null;
  const website = String(formData.get('website') || '').trim() || null;
  const notes = String(formData.get('notes') || '').trim() || null;
  if (!name_en && !name_ja) return;
  const db = supabaseAdmin();
  await db.from('tea_schools').insert({ name_en, name_ja, code, website, notes });
  revalidatePath('/admin/tea-schools');
}

export default async function TeaSchoolsPage() {
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const db = supabaseAdmin();
  const { data } = await db.from('tea_schools').select('id, code, name_en, name_ja, website').order('name_en');
  const schools = data || [];
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Tea Schools</h1>
      <form action={createSchool} className="card grid" style={{ gap: 8, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input name="name_en" className="input" placeholder="Name (EN)" />
          <input name="name_ja" className="input" placeholder="Name (JA)" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input name="code" className="input" placeholder="Code (optional)" />
          <input name="website" className="input" placeholder="Website (optional)" />
        </div>
        <textarea name="notes" className="textarea" placeholder="Notes (optional)" />
        <div><button className="button" type="submit">Add School</button></div>
      </form>

      <div className="grid" style={{ gap: 8 }}>
        {schools.map((s: any) => (
          <div key={s.id} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 8 }}>
            <div>
              <div className="text-sm"><strong>{s.name_en || s.name_ja}</strong>{s.name_en && s.name_ja ? <span> / <span lang="ja">{s.name_ja}</span></span> : null}</div>
              <div className="text-xs text-gray-600">{s.code || '—'} {s.website ? <span>· <a className="underline" href={s.website} target="_blank" rel="noreferrer">Website</a></span> : null}</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}


