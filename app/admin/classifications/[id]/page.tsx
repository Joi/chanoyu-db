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

  // Find linked objects
  const { data: links } = await db
    .from('object_classifications')
    .select('object_id')
    .eq('classification_id', cid);
  const objIds = Array.from(new Set((links || []).map((r: any) => r.object_id).filter(Boolean)));
  let objects: any[] = [];
  if (objIds.length) {
    const { data: objs } = await db
      .from('objects')
      .select('id, token, title, title_ja')
      .in('id', objIds);
    objects = objs || [];
  }

  // For thumbnails, fetch first media per object
  let mediaByObject: Record<string, string | undefined> = {};
  if (objects.length) {
    const { data: media } = await db
      .from('media')
      .select('id, object_id, uri, sort_order')
      .in('object_id', objects.map((o: any) => o.id));
    const grouped: Record<string, any[]> = {};
    for (const m of media || []) {
      const oid = (m as any).object_id as string;
      if (!grouped[oid]) grouped[oid] = [];
      grouped[oid].push(m);
    }
    for (const [oid, arr] of Object.entries(grouped)) {
      const sorted = (arr as any[]).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      mediaByObject[oid] = sorted[0]?.uri;
    }
  }

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-2">Classification</h1>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="text-sm"><strong>{(cls as any).label || (cls as any).uri}</strong>{(cls as any).label_ja ? <span lang="ja"> / {(cls as any).label_ja}</span> : null}</div>
        <div className="text-xs text-gray-600">{(cls as any).scheme} · <a className="underline" href={(cls as any).uri} target="_blank" rel="noreferrer">{(cls as any).uri}</a></div>
      </div>

      <AddObjectForm classificationId={(cls as any).id} />

      <h2 className="text-lg font-semibold mb-2">Objects</h2>
      {!objects.length ? <p className="text-sm text-gray-600">No objects linked.</p> : null}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {objects.map((o: any) => (
          <div key={o.id} className="card">
            <div style={{ position: 'relative', width: '100%', paddingTop: '66%', background: '#f5f5f5', borderRadius: 6, overflow: 'hidden' }}>
              {mediaByObject[o.id] ? (
                <a href={`/id/${o.token}`}>
                  <Image src={mediaByObject[o.id] as string} alt={o.title} fill sizes="240px" style={{ objectFit: 'cover' }} />
                </a>
              ) : null}
            </div>
            <div className="mt-2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <a className="underline text-sm" href={`/id/${o.token}`}>{o.title || o.title_ja || o.token}</a>
              <a className="underline text-xs" href={`/admin/${o.token}`} style={{ marginLeft: 'auto' }}>Edit</a>
              <UnlinkForm classificationId={(cls as any).id} objectId={o.id} />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

// ---- Server actions and client stubs ----

async function addObjectToClassification(formData: FormData) {
  'use server';
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const classification_id = String(formData.get('classification_id') || '');
  const token = String(formData.get('object_token') || '').trim();
  const role = String(formData.get('role') || 'primary type');
  if (!classification_id || !token) return;
  const db = supabaseAdmin();
  const { data: obj } = await db.from('objects').select('id').eq('token', token).maybeSingle();
  if (!obj?.id) return;
  await db.from('object_classifications').upsert({ object_id: obj.id, classification_id, role });
  revalidatePath(`/admin/classifications/${classification_id}`);
}

async function unlinkObjectClassification(formData: FormData) {
  'use server';
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const classification_id = String(formData.get('classification_id') || '');
  const object_id = String(formData.get('object_id') || '');
  if (!classification_id || !object_id) return;
  const db = supabaseAdmin();
  await db.from('object_classifications').delete().eq('classification_id', classification_id).eq('object_id', object_id);
  revalidatePath(`/admin/classifications/${classification_id}`);
}

function AddObjectForm({ classificationId }: { classificationId: string }) {
  return (
    <form action={addObjectToClassification} className="card" style={{ marginBottom: 16, display: 'grid', gap: 8 }}>
      <input type="hidden" name="classification_id" value={classificationId} />
      <div>
        <label className="label">Add object by token</label>
        <input name="object_token" className="input" placeholder="e.g., n887frf17nth" />
      </div>
      <div>
        <label className="label">Role</label>
        <input name="role" className="input" defaultValue="primary type" />
      </div>
      <div>
        <button className="button" type="submit">Link object</button>
      </div>
    </form>
  );
}

function UnlinkForm({ classificationId, objectId }: { classificationId: string; objectId: string }) {
  return (
    <form action={unlinkObjectClassification}>
      <input type="hidden" name="classification_id" value={classificationId} />
      <input type="hidden" name="object_id" value={objectId} />
      <button className="text-red-600 text-xs" type="submit">Unlink</button>
    </form>
  );
}



