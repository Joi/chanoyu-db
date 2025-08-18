import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { mintToken } from '@/lib/id';

async function createObject(formData: FormData): Promise<void> {
  'use server';
  const title = String(formData.get('title') || '').trim();
  const title_ja = String(formData.get('title_ja') || '').trim() || null;
  const local_number = String(formData.get('local_number') || '').trim() || null;
  const summary = String(formData.get('summary') || '').trim() || null;
  const summary_ja = String(formData.get('summary_ja') || '').trim() || null;

  if (!title) return;

  const token = mintToken(12);
  const db = supabaseAdmin();
  const { error } = await db.from('objects').insert({
    token,
    title,
    title_ja,
    local_number,
    summary,
    summary_ja,
    visibility: 'public',
  });
  if (error) return;
  revalidatePath(`/id/${token}`);
  redirect(`/admin/${token}`);
}

export default function NewObjectPage() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="card" style={{ padding: 24 }}>
        <h1 className="text-xl font-semibold mb-1">Create New Item</h1>
        <p className="text-sm text-gray-600 mb-4">Enter the core details now. You can add images and classifications after creation.</p>

        <form action={createObject} className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Title (EN)</label>
            <input name="title" className="input" required placeholder="e.g., Tea bowl" />
          </div>

          <div>
            <label className="label">Title (JA)</label>
            <input name="title_ja" className="input" placeholder="例: 茶碗" />
          </div>

          <div>
            <label className="label">Local number</label>
            <input name="local_number" className="input" placeholder="e.g., ITO-2025-I-0001" />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Summary (EN)</label>
            <textarea name="summary" className="textarea" placeholder="Short description…" />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Summary (JA)</label>
            <textarea name="summary_ja" className="textarea" placeholder="概要…" />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="button" type="submit">Create item</button>
            <span className="text-xs text-gray-600">Next: add images and classifications.</span>
          </div>
        </form>
      </div>
    </main>
  );
}
