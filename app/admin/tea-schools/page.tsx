import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

async function addSchool(formData: FormData) {
  'use server';
  const ok = await requireAdmin();
  if (!ok) return notFound();
  const name_en = String(formData.get('name_en') || '').trim();
  const name_ja = String(formData.get('name_ja') || '').trim() || null;
  if (!name_en) return;
  const db = supabaseAdmin();
  await db.from('tea_schools').insert({ name_en, name_ja });
  revalidatePath('/admin/tea-schools');
}

async function deleteSchool(formData: FormData) {
  'use server';
  const ok = await requireAdmin();
  if (!ok) return notFound();
  const id = String(formData.get('id') || '');
  if (!id) return;
  const db = supabaseAdmin();
  await db.from('tea_schools').delete().eq('id', id);
  revalidatePath('/admin/tea-schools');
}

export default async function TeaSchoolsPage() {
  const ok = await requireAdmin();
  if (!ok) return notFound();
  const db = supabaseAdmin();
  const { data } = await db.from('tea_schools').select('id,name_en,name_ja').order('name_en');
  const rows = Array.isArray(data) ? data : [];
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Tea schools</h1>
      <form action={addSchool} className="card grid" style={{ gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
        <div>
          <label className="label">Name (EN)</label>
          <input name="name_en" className="input" required />
        </div>
        <div>
          <label className="label">Name (JA)</label>
          <input name="name_ja" className="input" />
        </div>
        <div style={{ alignSelf: 'end' }}>
          <button className="button" type="submit">Add</button>
        </div>
      </form>

      <div className="grid" style={{ gap: 10, marginTop: 12 }}>
        {rows.map((s: any) => (
          <div key={s.id} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
            <div className="text-sm">{s.name_en}{s.name_ja ? <span lang="ja"> / {s.name_ja}</span> : null}</div>
            <form action={deleteSchool}>
              <input type="hidden" name="id" value={s.id} />
              <button className="text-red-600 text-sm" type="submit">Delete</button>
            </form>
          </div>
        ))}
      </div>
    </main>
  );
}


