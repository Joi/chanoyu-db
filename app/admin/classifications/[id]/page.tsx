import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function updateClassificationLabels(formData: FormData) {
  'use server';
  const id = String(formData.get('classification_id') || '');
  const label = String(formData.get('label') || '');
  const label_ja = String(formData.get('label_ja') || '');
  const ok = await requireAdmin();
  if (!ok || !id) return notFound();
  const db = supabaseAdmin();
  await db
    .from('classifications')
    .update({ label: label || null, label_ja: label_ja || null })
    .eq('id', id);
  revalidatePath(`/admin/classifications/${id}`);
  redirect(`/admin/classifications/${id}?saved=labels`);
}

async function addItemToClassification(formData: FormData) {
  'use server';
  const clsId = String(formData.get('classification_id') || '');
  const token = String(formData.get('object_token') || '').trim();
  const role = String(formData.get('role') || 'primary type');
  if (!clsId || !token) return;
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const db = supabaseAdmin();
  const { data: obj } = await db.from('objects').select('id').eq('token', token).maybeSingle();
  if (!obj) return redirect(`/admin/classifications/${clsId}?error=object-not-found`);
  await db.from('object_classifications').upsert({ object_id: obj.id, classification_id: clsId, role });
  revalidatePath(`/admin/classifications/${clsId}`);
  redirect(`/admin/classifications/${clsId}?saved=add`);
}

async function removeItemFromClassification(formData: FormData) {
  'use server';
  const clsId = String(formData.get('classification_id') || '');
  const objectId = String(formData.get('object_id') || '');
  const role = String(formData.get('role') || 'primary type');
  if (!clsId || !objectId) return;
  const ok = await requireAdmin();
  if (!ok) return notFound();
  const db = supabaseAdmin();
  await db.from('object_classifications').delete().eq('classification_id', clsId).eq('object_id', objectId).eq('role', role);
  revalidatePath(`/admin/classifications/${clsId}`);
  redirect(`/admin/classifications/${clsId}?saved=remove`);
}

export default async function ClassificationDetailPage({ params, searchParams }: { params: { id: string }, searchParams?: { [key: string]: string | string[] | undefined } }) {
  const ok = await requireAdmin();
  if (!ok) return notFound();
  const id = params.id;
  const db = supabaseAdmin();
  const { data: cls } = await db.from('classifications').select('id, scheme, uri, label, label_ja').eq('id', id).maybeSingle();
  if (!cls) return notFound();
  const { data: oc } = await db
    .from('object_classifications')
    .select('object:objects(id, token, title, title_ja)')
    .eq('classification_id', id);

  const objects = (oc || []).map((r: any) => r.object).filter(Boolean);

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-2">{cls.label || cls.uri}{cls.label_ja ? <span className="text-sm" lang="ja"> / {cls.label_ja}</span> : null}</h1>
      <p className="text-xs text-gray-600">{cls.scheme} · <a className="underline" href={cls.uri} target="_blank" rel="noreferrer">{cls.uri}</a></p>

      <div className="card" style={{ marginTop: 12 }}>
        <form action={updateClassificationLabels} className="grid" style={{ gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
          <input type="hidden" name="classification_id" value={cls.id} />
          <div>
            <label className="label">Label (EN)</label>
            <input name="label" className="input" defaultValue={cls.label || ''} />
          </div>
          <div>
            <label className="label">Label (JA)</label>
            <input name="label_ja" className="input" defaultValue={cls.label_ja || ''} />
          </div>
          <div style={{ alignSelf: 'end' }}>
            <button className="button" type="submit">Save labels</button>
          </div>
        </form>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <form action={addItemToClassification} className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <input type="hidden" name="classification_id" value={cls.id} />
          <div>
            <label className="label">Add object by token</label>
            <input name="object_token" className="input" placeholder="e.g., n887frf17nth" />
          </div>
          <div>
            <label className="label">Role</label>
            <input name="role" className="input" defaultValue="primary type" />
          </div>
          <div style={{ alignSelf: 'end' }}>
            <button className="button" type="submit">Add</button>
          </div>
        </form>
      </div>

      <h2 className="text-lg font-semibold mt-4 mb-2">Items</h2>
      <div className="grid" style={{ gap: 10 }}>
        {objects.map((o: any) => (
          <div key={o.id} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
            <div>
              <a className="underline" href={`/admin/${o.token}`}>{o.title || o.title_ja || o.token}</a>
              {o.title && o.title_ja ? <span className="text-sm" lang="ja"> / {o.title_ja}</span> : null}
            </div>
            <form action={removeItemFromClassification}>
              <input type="hidden" name="classification_id" value={cls.id} />
              <input type="hidden" name="object_id" value={o.id} />
              <input type="hidden" name="role" value="primary type" />
              <button className="button danger small" type="submit">Remove</button>
            </form>
          </div>
        ))}
      </div>
    </main>
  );
}


