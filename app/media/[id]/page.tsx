import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin, requireOwner } from '@/lib/auth';
// import { makeSupabaseThumbUrl } from '@/lib/storage';

async function updateMediaAction(formData: FormData) {
  'use server';
  const id = String(formData.get('media_id') || '');
  const copyright_owner = String(formData.get('copyright_owner') || '').trim() || null;
  const rights_note = String(formData.get('rights_note') || '').trim() || null;
  const license_id = String(formData.get('license_id') || '').trim() || null;
  if (!id) return;
  // Require at least admin
  const okAdmin = await requireAdmin();
  const okOwner = await requireOwner();
  if (!okAdmin && !okOwner) return;
  const db = supabaseAdmin();
  await db.from('media').update({ copyright_owner, rights_note, license_id }).eq('id', id);
  revalidatePath(`/media/${id}`);
  redirect(`/media/${id}?saved=media`);
}

async function linkObjectAction(formData: FormData) {
  'use server';
  const mediaId = String(formData.get('media_id') || '');
  const objectToken = String(formData.get('object_token') || '').trim();
  if (!mediaId || !objectToken) return;
  const okAdmin = await requireAdmin();
  const okOwner = await requireOwner();
  if (!okAdmin && !okOwner) return;
  const db = supabaseAdmin();
  const { data: obj } = await db.from('objects').select('id').eq('token', objectToken).maybeSingle();
  if (!obj) return redirect(`/media/${mediaId}?error=object-not-found`);
  // Upsert link
  await db.from('object_media_links').upsert({ object_id: obj.id, media_id: mediaId });
  revalidatePath(`/media/${mediaId}`);
  redirect(`/media/${mediaId}?saved=link`);
}

async function unlinkObjectAction(formData: FormData) {
  'use server';
  const mediaId = String(formData.get('media_id') || '');
  const objectId = String(formData.get('object_id') || '');
  const linkId = String(formData.get('link_id') || '');
  if (!mediaId || !objectId) return;
  const okAdmin = await requireAdmin();
  const okOwner = await requireOwner();
  if (!okAdmin && !okOwner) return;
  const db = supabaseAdmin();
  if (linkId) {
    await db.from('object_media_links').delete().eq('id', linkId);
  } else {
    // If it is the direct FK association, null it out instead
    await db.from('media').update({ object_id: null }).eq('id', mediaId).eq('object_id', objectId);
  }
  revalidatePath(`/media/${mediaId}`);
  redirect(`/media/${mediaId}?saved=unlink`);
}

export default async function MediaPage({ params, searchParams }: { params: { id: string }, searchParams?: { [key: string]: string | string[] | undefined } }) {
  const id = params.id;
  const db = supabaseAdmin();
  // Fetch media row without ambiguous embeds
  const { data: mediaRow, error } = await db
    .from('media')
    .select('id, uri, kind, copyright_owner, rights_note, bucket, storage_path, license_id, object_id, local_number')
    .eq('id', id)
    .single();
  if (error || !mediaRow) return notFound();

  // Resolve ALL linked objects: direct FK + many-to-many
  const { data: linkRows } = await db
    .from('object_media_links')
    .select('id, object_id')
    .eq('media_id', mediaRow.id);
  const objIds = new Set<string>();
  if (mediaRow.object_id) objIds.add(mediaRow.object_id);
  for (const r of linkRows || []) objIds.add((r as any).object_id);
  const idsArr = Array.from(objIds);
  let objectsById: Record<string, any> = {};
  if (idsArr.length) {
    const { data: objs } = await db.from('objects').select('id, token, title, title_ja').in('id', idsArr);
    for (const o of objs || []) objectsById[(o as any).id] = o;
  }
  const associations: Array<{ kind: 'direct' | 'link'; object: any; linkId: string | null }> = [];
  if (mediaRow.object_id && objectsById[mediaRow.object_id]) {
    associations.push({ kind: 'direct', object: objectsById[mediaRow.object_id], linkId: null });
  }
  for (const r of linkRows || []) {
    const oid = (r as any).object_id;
    if (oid && objectsById[oid]) {
      associations.push({ kind: 'link', object: objectsById[oid], linkId: (r as any).id });
    }
  }

  // License info and list for editing
  const [{ data: licOne }, { data: licList }, isOwner, isAdmin] = await Promise.all([
    mediaRow.license_id ? db.from('licenses').select('id, code, name, uri').eq('id', mediaRow.license_id).maybeSingle() : Promise.resolve({ data: null }),
    db.from('licenses').select('id, code, name, uri').order('code'),
    requireOwner(),
    requireAdmin(),
  ] as any);
  const canEdit = Boolean(isOwner || isAdmin);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-2">Media</h1>
      {typeof searchParams?.saved === 'string' ? (
        <div className="card" style={{ background: '#f0fff4', borderColor: '#bbf7d0', marginBottom: 12 }}>Saved media</div>
      ) : null}
      {mediaRow.uri ? (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', background: '#f5f5f5', borderRadius: 6, overflow: 'hidden', border: '1px solid #eee' }}>
          <a href={mediaRow.uri} target="_blank" rel="noreferrer">
            <Image src={mediaRow.uri} alt={associations[0]?.object?.title || 'Image'} fill sizes="(max-width: 768px) 100vw, 640px" style={{ objectFit: 'contain', background: '#fff' }} />
          </a>
        </div>
      ) : null}
      <div className="card" style={{ marginTop: 12 }}>
        <p><strong>Media number</strong>: {mediaRow.local_number || '—'}</p>
        <p><strong>Associated objects</strong>:</p>
        <ul className="list-disc pl-5">
          {associations.length === 0 ? <li className="text-sm text-gray-600">None</li> : null}
          {associations.map((a, i) => (
            <li key={i} className="text-sm">
              <a className="underline" href={`/id/${a.object.token}`}>{a.object.title || a.object.title_ja || a.object.token}</a>
              {a.object.title_ja ? <span lang="ja"> / {a.object.title_ja}</span> : null}
              <span className="text-xs text-gray-600"> · {a.kind === 'direct' ? 'primary link' : 'linked'}</span>
            </li>
          ))}
        </ul>
        <p><strong>Copyright owner</strong>: {mediaRow.copyright_owner || '—'}</p>
        <p><strong>Rights note</strong>: {mediaRow.rights_note || '—'}</p>
        <p><strong>License</strong>: {licOne ? <a className="underline" href={licOne.uri} target="_blank" rel="noreferrer">{licOne.code} — {licOne.name}</a> : '—'}</p>
        <p><strong>Storage</strong>: {mediaRow.bucket}/{(mediaRow.storage_path || '').replace(/^media\//,'') || '—'}</p>
      </div>

      {canEdit ? (
        <>
          <form action={updateMediaAction} className="card space-y-2" style={{ marginTop: 12 }}>
            <input type="hidden" name="media_id" value={mediaRow.id} />
            <label className="label">Copyright owner</label>
            <input name="copyright_owner" className="input" defaultValue={mediaRow.copyright_owner || ''} />
            <label className="label">License</label>
            <select name="license_id" className="input" defaultValue={mediaRow.license_id || ''}>
              <option value="">Select license</option>
              {(licList || []).map((lic: any) => (
                <option key={lic.id} value={lic.id}>{lic.code} — {lic.name}</option>
              ))}
            </select>
            <label className="label">Rights/metadata note</label>
            <textarea name="rights_note" className="textarea" defaultValue={mediaRow.rights_note || ''} />
            <div><button className="button" type="submit">Save</button></div>
          </form>

          <div className="card" style={{ marginTop: 12 }}>
            <h3 className="text-md font-semibold mb-2">Link this media to another object</h3>
            <form action={linkObjectAction} className="space-y-2">
              <input type="hidden" name="media_id" value={mediaRow.id} />
              <label className="label">Object token</label>
              <input name="object_token" className="input" placeholder="e.g., n887frf17nth" />
              <button className="button" type="submit">Link object</button>
            </form>
          </div>

          {associations.length ? (
            <div className="card" style={{ marginTop: 12 }}>
              <h3 className="text-md font-semibold mb-2">Unlink object</h3>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {associations.map((a, i) => (
                  <form key={i} action={unlinkObjectAction} className="space-y-2">
                    <input type="hidden" name="media_id" value={mediaRow.id} />
                    <input type="hidden" name="object_id" value={a.object.id} />
                    {a.linkId ? <input type="hidden" name="link_id" value={a.linkId} /> : null}
                    <div className="text-sm">{a.object.title || a.object.title_ja || a.object.token}</div>
                    <button className="button secondary" type="submit">Unlink</button>
                  </form>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
