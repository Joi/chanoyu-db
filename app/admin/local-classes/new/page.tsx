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
    redirect(`/admin/local-classes/new?error=create`);
  }
  revalidatePath('/admin/local-classes');
  redirect(`/admin/local-classes?saved=create`);
}

export default async function NewLocalClassPage() {
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
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
    </main>
  );
}


