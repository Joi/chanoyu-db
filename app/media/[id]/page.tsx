import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin, requireOwner, currentUserEmail } from '@/lib/auth';
// import { makeSupabaseThumbUrl } from '@/lib/storage';
import { parseSupabasePublicUrl } from '@/lib/storage';

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

async function linkLocationAction(formData: FormData) {
  'use server';
  const mediaId = String(formData.get('media_id') || '');
  const locationRef = String(formData.get('location_ref') || '').trim();
  if (!mediaId || !locationRef) return;
  const okAdmin = await requireAdmin();
  const okOwner = await requireOwner();
  if (!okAdmin && !okOwner) return;
  const db = supabaseAdmin();
  let locId: string | null = null;
  if (/^[0-9a-fA-F-]{36}$/.test(locationRef)) {
    locId = locationRef;
  } else {
    const { data: byToken } = await db.from('locations').select('id').eq('token', locationRef).maybeSingle();
    locId = (byToken as any)?.id || null;
    if (!locId) {
      const { data: byLocal } = await db.from('locations').select('id').ilike('local_number', locationRef).maybeSingle();
      locId = (byLocal as any)?.id || null;
    }
  }
  if (!locId) return redirect(`/media/${mediaId}?error=location-not-found`);
  await db.from('location_media_links').upsert({ location_id: locId, media_id: mediaId });
  revalidatePath(`/media/${mediaId}`);
  redirect(`/media/${mediaId}?saved=link-location`);
}

async function unlinkLocationAction(formData: FormData) {
  'use server';
  const mediaId = String(formData.get('media_id') || '');
  const locationId = String(formData.get('location_id') || '');
  if (!mediaId || !locationId) return;
  const okAdmin = await requireAdmin();
  const okOwner = await requireOwner();
  if (!okAdmin && !okOwner) return;
  const db = supabaseAdmin();
  await db.from('location_media_links').delete().eq('media_id', mediaId).eq('location_id', locationId);
  revalidatePath(`/media/${mediaId}`);
  redirect(`/media/${mediaId}?saved=unlink-location`);
}

export default async function MediaPage({ params, searchParams }: { params: { id: string }, searchParams?: { [key: string]: string | string[] | undefined } }) {
  const idParam = params.id;
  const db = supabaseAdmin();
  const email = await currentUserEmail();
  const isPrivileged = await requireAdmin();
  const isOwner = await requireOwner();
  
  // Fetch media row without ambiguous embeds
  const isUuid = /^[0-9a-fA-F-]{36}$/.test(idParam);
  const baseQuery = db
    .from('media')
    .select('id, uri, kind, copyright_owner, rights_note, bucket, storage_path, license_id, object_id, local_number, token, visibility');
  const { data: mediaRow, error } = isUuid
    ? await baseQuery.eq('id', idParam).single()
    : await baseQuery.eq('token', idParam).single();
  if (error || !mediaRow) return notFound();

  // Access control enforcement
  let canAccess = false;
  
  // Privileged users can access any media
  if (isPrivileged || isOwner) {
    canAccess = true;
  }
  // Public media can be accessed by anyone
  else if (mediaRow.visibility === 'public') {
    canAccess = true;
  }
  // Private media requires additional checks
  else if (mediaRow.visibility === 'private' && email) {
    // Check if user is an attendee of any chakai that includes this media
    const { data: chakaiLinks } = await db
      .from('chakai_media_links')
      .select('chakai_id, chakai:chakai!inner(visibility)')
      .eq('media_id', mediaRow.id);
    
    for (const link of chakaiLinks || []) {
      const chakai = (link as any).chakai;
      // For member chakai events, check if user is an attendee
      if (chakai.visibility === 'members') {
        const { data: attendeeCheck } = await db
          .from('chakai_attendees')
          .select('chakai_id, accounts!inner(email)')
          .eq('chakai_id', (link as any).chakai_id)
          .eq('accounts.email', email);
        if (attendeeCheck && attendeeCheck.length) {
          canAccess = true;
          break;
        }
      }
    }
  }
  
  // Deny access if user doesn't have permission
  if (!canAccess) {
    return notFound();
  }

  // Canonicalize: if requested by UUID and we have a token, redirect to token URL
  if (isUuid && mediaRow.token) {
    return redirect(`/media/${mediaRow.token}`);
  }

  // Resolve ALL linked objects: direct FK + many-to-many
  const { data: linkRows } = await db
    .from('object_media_links')
    .select('object_id, media_id')
    .eq('media_id', mediaRow.id);
  const objIds = new Set<string>();
  if (mediaRow.object_id) objIds.add(mediaRow.object_id);
  for (const r of (linkRows || [])) objIds.add((r as any).object_id);
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
  for (const r of (linkRows || [])) {
    const oid = (r as any).object_id;
    if (oid && objectsById[oid]) {
      associations.push({ kind: 'link', object: objectsById[oid], linkId: null });
    }
  }

  // Fetch linked tea rooms (locations)
  const { data: locLinks } = await db
    .from('location_media_links')
    .select('location_id')
    .eq('media_id', mediaRow.id);
  const locIds = Array.from(new Set((locLinks || []).map((r: any) => r.location_id)));
  let locations: any[] = [];
  if (locIds.length) {
    const { data: locs } = await db
      .from('locations')
      .select('id, name, name_en, name_ja, local_number, token')
      .in('id', locIds);
    locations = locs || [];
  }

  // License info and list for editing
  const [{ data: licOne }, { data: licList }, isOwnerEdit, isAdminEdit] = await Promise.all([
    mediaRow.license_id ? db.from('licenses').select('id, code, name, uri').eq('id', mediaRow.license_id).maybeSingle() : Promise.resolve({ data: null }),
    db.from('licenses').select('id, code, name, uri').order('code'),
    requireOwner(),
    requireAdmin(),
  ] as any);
  const canEdit = Boolean(isOwnerEdit || isAdminEdit);

  async function deleteMediaAction(formData: FormData) {
    'use server';
    const okAdmin = await requireAdmin();
    const okOwner = await requireOwner();
    if (!okAdmin && !okOwner) return;
    const mediaId = String(formData.get('media_id') || '');
    if (!mediaId) return;
    const db2 = supabaseAdmin();
    const { data } = await db2.from('media').select('id, uri').eq('id', mediaId).maybeSingle();
    if (data?.uri) {
      const parsed = parseSupabasePublicUrl(data.uri);
      if (parsed) {
        try {
          // @ts-ignore
          await (db2 as any).storage.from(parsed.bucket).remove([parsed.path]);
        } catch {}
      }
    }
    await db2.from('media').delete().eq('id', mediaId);
    redirect('/admin/media');
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-2">Media {mediaRow.token ? <span className="text-sm text-gray-600">({mediaRow.token})</span> : null}</h1>
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
        <p><strong>Media number</strong>: {mediaRow.local_number || '—'}{mediaRow.token ? <span className="text-xs text-gray-600"> · token:{mediaRow.token}</span> : null}</p>
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
        <form action={deleteMediaAction} className="mt-3">
          <input type="hidden" name="media_id" value={mediaRow.id} />
          <button className="text-red-600 text-sm underline" type="submit">Delete media</button>
        </form>
      </div>

      {canEdit ? (
        <>
          <form action={updateMediaAction} className="card space-y-2" style={{ marginTop: 12 }}>
            <input type="hidden" name="media_id" value={mediaRow.id} />
            <div className="space-y-1">
              <label className="label">Copyright owner</label>
              <input name="copyright_owner" className="input" defaultValue={mediaRow.copyright_owner || ''} />
            </div>
            <div className="space-y-1">
              <label className="label">License</label>
              <select name="license_id" className="input" defaultValue={mediaRow.license_id || ''}>
                <option value="">Select license</option>
                {(licList || []).map((lic: any) => (
                  <option key={lic.id} value={lic.id}>{lic.code} — {lic.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="label">Rights/metadata note</label>
              <textarea name="rights_note" className="textarea" defaultValue={mediaRow.rights_note || ''} />
            </div>
            <div><button className="button" type="submit">Save</button></div>
          </form>

          <div className="card" style={{ marginTop: 12 }}>
            <h3 className="text-md font-semibold mb-2">Link this media to another object</h3>
            <form action={linkObjectAction} className="space-y-2">
              <input type="hidden" name="media_id" value={mediaRow.id} />
              <div className="space-y-1">
                <label className="label">Object token</label>
                <input name="object_token" className="input" placeholder="e.g., n887frf17nth" />
              </div>
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

          {locations.length ? (
            <div className="card" style={{ marginTop: 12 }}>
              <h3 className="text-md font-semibold mb-2">Linked tea rooms</h3>
              <ul className="space-y-2">
                {locations.map((l: any) => (
                  <li key={l.id} className="flex items-center justify-between">
                    <div className="text-sm">
                      <a className="underline" href={`/admin/tea-rooms/${l.id}`}>{l.name_en || l.name_ja || l.name}</a>
                      {l.local_number ? <span> · {l.local_number}</span> : null}
                      {l.token ? <span className="text-xs text-gray-500"> · {l.token}</span> : null}
                    </div>
                    <form action={unlinkLocationAction}>
                      <input type="hidden" name="media_id" value={mediaRow.id} />
                      <input type="hidden" name="location_id" value={l.id} />
                      <button className="text-red-600 text-sm" type="submit">Unlink</button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
