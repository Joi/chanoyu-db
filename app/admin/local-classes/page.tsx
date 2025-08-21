import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { mintToken } from '@/lib/id';
import SearchSelect from '@/app/components/SearchSelect';
import SubmitButton from '@/app/components/SubmitButton';

async function createLocalClassAction(formData: FormData) {
  'use server';
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const label_en = String(formData.get('label_en') || '').trim() || null;
  const label_ja = String(formData.get('label_ja') || '').trim() || null;
  const description = String(formData.get('description') || '').trim() || null;
  const parentRaw = String(formData.get('parent_local_class_id') || '');
  const parent_id = parentRaw.split(',').map((s) => s.trim()).filter(Boolean)[0] || null;
  const db = supabaseAdmin();
  const token = mintToken();
  const { error } = await db.from('local_classes').insert({ token, label_en, label_ja, description, parent_id });
  if (error) {
    console.error('[local-classes:create] error', error.message || error);
    redirect(`/admin/local-classes?error=create`);
  }
  revalidatePath('/admin/local-classes');
  redirect(`/admin/local-classes?saved=create`);
}

export const dynamic = 'force-dynamic';

export default async function LocalClassesIndex({ searchParams }: { searchParams?: { [k: string]: string | string[] | undefined } }) {
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const db = supabaseAdmin();

  const q = typeof searchParams?.q === 'string' ? String(searchParams!.q) : '';
  let query = db
    .from('local_classes')
    .select('id, token, local_number, label_en, label_ja, parent_id')
    .order('local_number')
    .limit(200);
  if (q) {
    query = query.or([
      `label_en.ilike.%${q}%`,
      `label_ja.ilike.%${q}%`,
      `local_number.ilike.%${q}%`,
    ].join(','));
  }
  const { data: rows } = await query;
  const list = Array.isArray(rows) ? rows : [];
  const ids = list.map((r: any) => r.id);

  const [directCountsRes, totalCountsRes] = ids.length
    ? await Promise.all([
        db.from('local_class_object_counts_direct').select('local_class_id, object_count').in('local_class_id', ids),
        db.from('local_class_object_counts_total').select('local_class_id, object_count').in('local_class_id', ids),
      ])
    : [{ data: [] } as any, { data: [] } as any];

  const directCounts = new Map<string, number>();
  for (const r of (directCountsRes?.data as any[]) || []) directCounts.set(String(r.local_class_id), Number(r.object_count || 0));
  const totalCounts = new Map<string, number>();
  for (const r of (totalCountsRes?.data as any[]) || []) totalCounts.set(String(r.local_class_id), Number(r.object_count || 0));

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-3">Local Classes</h1>
      <form className="flex gap-2 mb-4">
        <input name="q" className="input" placeholder="Search local classes..." defaultValue={q} />
        <button className="button" type="submit">Search</button>
      </form>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-2">Create Local Class</h2>
        <form action={createLocalClassAction} className="grid gap-2">
          <label className="label">Label (EN)</label>
          <input name="label_en" className="input" />
          <label className="label">Label (JA)</label>
          <input name="label_ja" className="input" />
          <label className="label">Description</label>
          <textarea name="description" className="textarea" />
          <SearchSelect
            name="parent_local_class_id"
            label="Parent (optional)"
            searchPath="/api/search/local-classes"
            valueKey="id"
            labelFields={["display","label_ja","label_en","local_number"]}
            placeholder="Search parent class..."
          />
          <SubmitButton label="Create" pendingLabel="Creating..." />
        </form>
      </div>

      <ul className="grid gap-2">
        {list.map((r: any) => {
          const title = String(r.label_ja || r.label_en || r.local_number || r.token || r.id);
          const direct = directCounts.get(String(r.id)) || 0;
          const total = totalCounts.get(String(r.id)) || direct;
          return (
            <li key={r.id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{title}</div>
                  <div className="text-xs text-gray-600">{r.local_number || r.token}</div>
                </div>
                <div className="text-xs text-gray-700">{direct} direct · {total} total</div>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}


