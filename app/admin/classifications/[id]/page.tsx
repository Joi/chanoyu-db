import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Image from 'next/image';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ClassificationDetail({ params }: { params: { id: string } }) {
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const db = supabaseAdmin();

  const cid = params.id;
  const { data: cls } = await db
    .from('classifications')
    .select('id, scheme, uri, label, label_ja, kind')
    .eq('id', cid)
    .maybeSingle();
  if (!cls) return redirect('/admin/classifications');

  // Find linked Local Classes
  const { data: lcLinks } = await db
    .from('local_class_links')
    .select('local_class_id')
    .eq('classification_id', cid);
  const lcIds = Array.from(new Set((lcLinks || []).map((r: any) => r.local_class_id).filter(Boolean)));
  let localClasses: any[] = [];
  if (lcIds.length) {
    const { data: rows } = await db
      .from('local_classes')
      .select('id, token, local_number, label_en, label_ja, preferred_classification_id')
      .in('id', lcIds);
    localClasses = rows || [];
  }

  // Load options for pulldown
  const { data: allLocalClasses } = await db
    .from('local_classes')
    .select('id, label_en, label_ja, local_number')
    .order('local_number')
    .limit(1000);

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-2">Classification</h1>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="text-sm"><strong>{(cls as any).label || (cls as any).uri}</strong>{(cls as any).label_ja ? <span lang="ja"> / {(cls as any).label_ja}</span> : null}</div>
        <div className="text-xs text-gray-600">{(cls as any).scheme} · <a className="underline" href={(cls as any).uri} target="_blank" rel="noreferrer">{(cls as any).uri}</a></div>
      </div>

      <LinkLocalClassForm classificationId={(cls as any).id} allLocalClasses={allLocalClasses || []} />

      <h2 className="text-lg font-semibold mb-2">Linked Local Classes</h2>
      {!localClasses.length ? <p className="text-sm text-gray-600">No local classes linked.</p> : null}
      <ul className="grid gap-2">
        {localClasses.map((c: any) => {
          const isPref = String(c.preferred_classification_id || '') === String((cls as any).id);
          return (
            <li key={c.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8 }}>
              <a className="underline text-sm" href={`/admin/local-classes/${c.id}`}>{String(c.label_ja || c.label_en || c.local_number || c.id)}</a>
              {isPref ? (
                <span className="text-xs">Preferred</span>
              ) : (
                <form action={setPreferredForClass}>
                  <input type="hidden" name="classification_id" value={String((cls as any).id)} />
                  <input type="hidden" name="local_class_id" value={String(c.id)} />
                  <button className="text-xs underline" type="submit">Set preferred</button>
                </form>
              )}
              <UnlinkLocalClassForm classificationId={(cls as any).id} localClassId={c.id} />
            </li>
          );
        })}
      </ul>
    </main>
  );
}

// ---- Server actions and client stubs ----

// Link a Classification to a Local Class
async function linkClassificationToLocalClass(formData: FormData) {
  'use server';
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const classification_id = String(formData.get('classification_id') || '');
  const local_class_id = String(formData.get('local_class_id') || '');
  const set_preferred = String(formData.get('set_preferred') || '') === 'on';
  if (!classification_id || !local_class_id) return;
  const db = supabaseAdmin();
  await db.from('local_class_links').upsert({ classification_id, local_class_id });
  if (set_preferred) {
    await db.from('local_classes').update({ preferred_classification_id: classification_id }).eq('id', local_class_id);
  }
  revalidatePath(`/admin/classifications/${classification_id}`);
}

async function unlinkClassificationFromLocalClass(formData: FormData) {
  'use server';
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const classification_id = String(formData.get('classification_id') || '');
  const local_class_id = String(formData.get('local_class_id') || '');
  if (!classification_id || !local_class_id) return;
  const db = supabaseAdmin();
  await db.from('local_class_links').delete().eq('classification_id', classification_id).eq('local_class_id', local_class_id);
  revalidatePath(`/admin/classifications/${classification_id}`);
}

// Set preferred for a given Local Class
async function setPreferredForClass(formData: FormData) {
  'use server';
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const classification_id = String(formData.get('classification_id') || '');
  const local_class_id = String(formData.get('local_class_id') || '');
  if (!classification_id || !local_class_id) return;
  const db = supabaseAdmin();
  await db.from('local_classes').update({ preferred_classification_id: classification_id }).eq('id', local_class_id);
  revalidatePath(`/admin/classifications/${classification_id}`);
}

function LinkLocalClassForm({ classificationId, allLocalClasses }: { classificationId: string; allLocalClasses: any[] }) {
  return (
    <form action={linkClassificationToLocalClass} className="card" style={{ marginBottom: 16, display: 'grid', gap: 8 }}>
      <input type="hidden" name="classification_id" value={classificationId} />
      <div>
        <label className="label">Link to Local Class</label>
        <select name="local_class_id" className="input" defaultValue="">
          <option value="">(select)</option>
          {(allLocalClasses || []).map((c: any) => (
            <option key={String(c.id)} value={String(c.id)}>
              {String(c.label_ja || c.label_en || c.local_number || c.id)}
            </option>
          ))}
        </select>
      </div>
      <label className="text-xs flex items-center gap-2"><input type="checkbox" name="set_preferred" /> Set as preferred for this class</label>
      <div>
        <button className="button" type="submit">Link</button>
      </div>
    </form>
  );
}

function UnlinkLocalClassForm({ classificationId, localClassId }: { classificationId: string; localClassId: string }) {
  return (
    <form action={unlinkClassificationFromLocalClass}>
      <input type="hidden" name="classification_id" value={classificationId} />
      <input type="hidden" name="local_class_id" value={localClassId} />
      <button className="text-red-600 text-xs" type="submit">Unlink</button>
    </form>
  );
}



