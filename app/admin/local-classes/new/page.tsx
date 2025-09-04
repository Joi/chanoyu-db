import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { mintToken } from '@/lib/id';
import { supabaseAdmin } from '@/lib/supabase/server';
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
  
  // For top-level classes, assign the next available sort_order
  let sort_order = null;
  if (!parent_id) {
    const { data: maxSortResult } = await db
      .from('local_classes')
      .select('sort_order')
      .is('parent_id', null)
      .order('sort_order', { ascending: false, nullsFirst: false })
      .limit(1);
    
    const maxSort = maxSortResult?.[0]?.sort_order;
    sort_order = (maxSort ? maxSort + 1 : 1);
  }
  
  const { data: created, error } = await db.from('local_classes').insert({ token, label_en, label_ja, description, parent_id, sort_order }).select('id').single();
  if (error) {
    console.error('[local-classes:create] error', error.message || error);
    redirect(`/admin/local-classes/new?error=create`);
  }
  const classification_id = String(formData.get('existing_classification_id') || '').trim();
  if (created?.id && classification_id) {
    await db.from('local_class_links').upsert({ local_class_id: created.id, classification_id });
  }
  revalidatePath('/admin/local-classes');
  redirect(`/admin/local-classes?saved=create`);
}

export default async function NewLocalClassPage() {
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const db = supabaseAdmin();
  // For ease-of-use, provide pulldowns of existing classes and AAT/Wikidata
  const [{ data: classes }, { data: ext }] = await Promise.all([
    db.from('local_classes').select('id, label_en, label_ja, local_number').order('local_number').limit(1000),
    db.from('classifications').select('id, scheme, uri, label, label_ja').in('scheme', ['aat','wikidata']).order('scheme').order('label').limit(1000),
  ]);
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-3">Create Local Class</h1>
      <form action={createLocalClassAction} className="grid gap-2 card">
        <label className="label">Label (EN)</label>
        <input name="label_en" className="input" />
        <label className="label">Label (JA)</label>
        <input name="label_ja" className="input" />
        <label className="label">Description</label>
        <textarea name="description" className="textarea" />
        <label className="label">Parent (optional)</label>
        <select name="parent_local_class_id" className="input">
          <option value="">(none)</option>
          {(classes || []).map((c: any) => (
            <option key={String(c.id)} value={String(c.id)}>{String(c.label_ja || c.label_en || c.local_number || c.id)}</option>
          ))}
        </select>
        <details>
          <summary className="cursor-pointer text-sm">Attach existing AAT/Wikidata (optional)</summary>
          <div className="grid gap-2 mt-2">
            <select name="existing_classification_id" className="input">
              <option value="">(select AAT/Wikidata)</option>
              {(ext || []).map((c: any) => (
                <option key={String(c.id)} value={String(c.id)}>{`${c.scheme}: ${String(c.label_ja || c.label || c.uri)}`}</option>
              ))}
            </select>
          </div>
        </details>
        <SubmitButton label="Create" pendingLabel="Creating..." />
      </form>
    </main>
  );
}


