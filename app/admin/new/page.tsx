import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { mintToken } from '@/lib/id';

async function createObject(formData: FormData): Promise<void> {
  'use server';
  const title = String(formData.get('title') || '').trim();
  const title_ja = String(formData.get('title_ja') || '').trim() || null;
  const local_number = String(formData.get('local_number') || '').trim() || null;

  if (!title) return;

  const token = mintToken(12);
  const db = supabaseAdmin();
  const { error } = await db.from('objects').insert({
    token,
    title,
    title_ja,
    local_number,
    visibility: 'public',
  });
  if (error) return;
  revalidatePath(`/id/${token}`);
  redirect(`/admin/${token}`);
}

export default function NewObjectPage() {
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">New Object</h1>
      <form action={createObject} className="space-y-3">
        <div>
          <label className="block text-sm">Title (EN)</label>
          <input name="title" className="border rounded p-2 w-full" required />
        </div>
        <div>
          <label className="block text-sm">Title (JA)</label>
          <input name="title_ja" className="border rounded p-2 w-full" />
        </div>
        <div>
          <label className="block text-sm">Local Number</label>
          <input name="local_number" className="border rounded p-2 w-full" />
        </div>
        
        <p className="text-xs text-gray-600">After saving, use <a className="underline" href="/lookup">Lookup</a> to find AAT/Wikidata and attach in DB (next step).</p>
        <button className="bg-black text-white px-4 py-2 rounded" type="submit">Create</button>
      </form>
    </main>
  );
}
