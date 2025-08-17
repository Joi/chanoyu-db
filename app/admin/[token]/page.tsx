import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { parseSupabasePublicUrl } from '@/lib/storage';
import { translateText } from '@/lib/translate';
import LookupPanel from './lookup-panel';
import { requireOwner, requireAdmin } from '@/lib/auth';

// Server action to save a classification for the current object token
async function saveClassificationAction(formData: FormData) {
  'use server';
  const token = String(formData.get('object_token') || '');
  const scheme = String(formData.get('scheme') || '');
  const uri = String(formData.get('uri') || '');
  const label = String(formData.get('label') || '');
  const label_ja = String(formData.get('label_ja') || '');
  const role = String(formData.get('role') || 'primary type');
  const db = supabaseAdmin();
  try {
    console.log('[classification] start', { token, scheme, uri, role });
    if (!token || !scheme || !uri) throw new Error('missing token|scheme|uri');
    const { data: obj, error: eObj } = await db.from('objects').select('id').eq('token', token).single();
    if (eObj || !obj) throw eObj || new Error('object not found');

    // Find existing classification by scheme+uri, or create if missing
    let clsId: string | null = null;
    const { data: existing, error: eFind } = await db
      .from('classifications')
      .select('id')
      .eq('scheme', scheme)
      .eq('uri', uri)
      .maybeSingle();
    if (eFind) throw eFind;
    if (existing?.id) {
      clsId = existing.id;
    } else {
      const { data: inserted, error: eIns } = await db
        .from('classifications')
        .insert({ scheme, uri, label, label_ja, kind: 'concept' })
        .select('id')
        .single();
      if (eIns || !inserted) throw eIns || new Error('classification insert failed');
      clsId = inserted.id;
    }

    const { error: eLink } = await db
      .from('object_classifications')
      .upsert({ object_id: obj.id, classification_id: clsId, role });
    if (eLink) throw eLink;

    console.log('[classification] saved', { token, cls: clsId });
    revalidatePath(`/admin/${token}`);
    redirect(`/admin/${token}?saved=classification`);
  } catch (err: any) {
    console.error('[classification] error', err?.message || err);
    redirect(`/admin/${token}?error=classification`);
  }
}

async function deleteMediaAction(formData: FormData) {
  'use server';
  const mediaId = String(formData.get('media_id') || '');
  const objectToken = String(formData.get('object_token') || '');
  try {
    console.log('[media:delete] start', { mediaId, objectToken });
    if (!mediaId) throw new Error('missing mediaId');
    const db = supabaseAdmin();
    const { data, error } = await db.from('media').select('id, uri').eq('id', mediaId).single();
    if (error) throw error;
    if (data) {
      const parsed = parseSupabasePublicUrl(data.uri);
      if (parsed) {
        try {
          // @ts-ignore
          await (db as any).storage.from(parsed.bucket).remove([parsed.path]);
        } catch (e) {
          console.error('[media:delete] storage remove error', e);
        }
      }
      const { error: eDel } = await db.from('media').delete().eq('id', mediaId);
      if (eDel) throw eDel;
    }
    console.log('[media:delete] done', mediaId);
    revalidatePath(`/admin/${objectToken}`);
    redirect(`/admin/${objectToken}?saved=media-delete`);
  } catch (err: any) {
    console.error('[media:delete] error', err?.message || err);
    redirect(`/admin/${objectToken}?error=media-delete`);
  }
}

async function addMediaUrlAction(formData: FormData) {
  'use server';
  const token = String(formData.get('object_token') || '');
  const url = String(formData.get('image_url') || '').trim();
  const db = supabaseAdmin();
  try {
    console.log('[media:url] start', { token, url });
    if (!token || !url) throw new Error('missing token|url');
    const { data: obj, error: eObj } = await db.from('objects').select('id').eq('token', token).single();
    if (eObj || !obj) throw eObj || new Error('object not found');
    const { error: eIns } = await db.from('media').insert({ object_id: obj.id, uri: url, kind: 'image', sort_order: 999 });
    if (eIns) throw eIns;
    console.log('[media:url] saved');
    revalidatePath(`/admin/${token}`);
    redirect(`/admin/${token}?saved=media-url`);
  } catch (err: any) {
    console.error('[media:url] error', err?.message || err);
    redirect(`/admin/${token}?error=media-url`);
  }
}

async function uploadMediaFileAction(formData: FormData) {
  'use server';
  const token = String(formData.get('object_token') || '');
  const file = formData.get('file') as File | null;
  const db = supabaseAdmin();
  try {
    console.log('[media:upload] start', { token, filename: file?.name, size: file && 'size' in file ? (file as any).size : undefined });
    if (!token || !file) throw new Error('missing token|file');
    const { data: obj, error: eObj } = await db.from('objects').select('id').eq('token', token).single();
    if (eObj || !obj) throw eObj || new Error('object not found');
    // Ensure public storage bucket exists (first upload on a fresh project)
    try {
      // @ts-ignore
      const b = await (db as any).storage.getBucket('media');
      if (!b || (b && b.error) || (b && b.data == null)) {
        // @ts-ignore
        const created = await (db as any).storage.createBucket('media', { public: true });
        if (created?.error) throw created.error;
        console.log('[media:upload] bucket created: media');
      }
    } catch (e: any) {
      console.error('[media:upload] ensure bucket error', e?.message || e);
      throw new Error('media bucket missing');
    }
    const arrayBuffer = await file.arrayBuffer();
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
    const filename = `${obj.id}-${Date.now()}.${ext}`;
    const path = `media/${obj.id}/${filename}`;
    // @ts-ignore
    const body: any = typeof Buffer !== 'undefined' ? Buffer.from(arrayBuffer) : arrayBuffer;
    // @ts-ignore
    const upload = await (db as any).storage.from('media').upload(path, body, { contentType: file.type || 'application/octet-stream', upsert: false });
    if (upload.error) throw upload.error;
    // @ts-ignore
    const pub = (db as any).storage.from('media').getPublicUrl(path);
    const uri = pub?.data?.publicUrl as string | undefined;
    if (!uri) throw new Error('public url missing');
    const { error: eIns } = await db.from('media').insert({ object_id: obj.id, uri, kind: 'image', sort_order: 999 });
    if (eIns) throw eIns;
    console.log('[media:upload] saved', { path });
    revalidatePath(`/admin/${token}`);
    redirect(`/admin/${token}?saved=media-upload`);
  } catch (err: any) {
    console.error('[media:upload] error', err?.message || err);
    redirect(`/admin/${token}?error=media-upload`);
  }
}

async function updateMediaAction(formData: FormData) {
  'use server';
  const id = String(formData.get('media_id') || '');
  const token = String(formData.get('object_token') || '');
  const copyright_owner = String(formData.get('copyright_owner') || '').trim() || null;
  const rights_note = String(formData.get('rights_note') || '').trim() || null;
  const license_id = String(formData.get('license_id') || '').trim() || null;
  if (!id) return;
  const db = supabaseAdmin();
  await db.from('media').update({ copyright_owner, rights_note, license_id }).eq('id', id);
  revalidatePath(`/admin/${token}`);
}

async function autoTranslate(formData: FormData) {
  'use server';
  const token = String(formData.get('object_token') || '');
  const db = supabaseAdmin();
  const { data } = await db
    .from('objects')
    .select('id, title, title_ja, summary, summary_ja, craftsman, craftsman_ja, store, store_ja, location, location_ja, notes, notes_ja')
    .eq('token', token)
    .single();
  if (!data) return;

  const updates: Record<string, string> = {};
  const maybe = async (srcKey: keyof typeof data, dstKey: keyof typeof data, srcLang: 'en'|'ja', dstLang: 'en'|'ja') => {
    const srcVal = (data as any)[srcKey];
    const dstVal = (data as any)[dstKey];
    if (srcVal && !dstVal) {
      const t = await translateText(String(srcVal), dstLang, srcLang);
      if (t) updates[dstKey as string] = t;
    }
  };

  await maybe('title','title_ja','en','ja');
  await maybe('title_ja','title','ja','en');
  await maybe('summary','summary_ja','en','ja');
  await maybe('summary_ja','summary','ja','en');
  await maybe('craftsman','craftsman_ja','en','ja');
  await maybe('craftsman_ja','craftsman','ja','en');
  await maybe('store','store_ja','en','ja');
  await maybe('store_ja','store','ja','en');
  await maybe('location','location_ja','en','ja');
  await maybe('location_ja','location','ja','en');
  await maybe('notes','notes_ja','en','ja');
  await maybe('notes_ja','notes','ja','en');

  if (Object.keys(updates).length > 0) {
    await db.from('objects').update(updates).eq('id', data.id);
  }
  revalidatePath(`/admin/${token}`);
}

// New: object metadata update action
async function updateObjectAction(formData: FormData) {
  'use server';
  const token = String(formData.get('object_token') || '');
  if (!token) return;
  const okOwner = await requireOwner();
  const okAdmin = await requireAdmin();
  const toNull = (v: string) => (v.trim() ? v.trim() : null);
  const title = String(formData.get('title') || '');
  const title_ja = String(formData.get('title_ja') || '');
  const local_number = String(formData.get('local_number') || '');
  const summary = String(formData.get('summary') || '');
  const summary_ja = String(formData.get('summary_ja') || '');
  const craftsman = String(formData.get('craftsman') || '');
  const event_date = String(formData.get('event_date') || '');
  const notes = String(formData.get('notes') || '');
  const url = String(formData.get('url') || '');
  const tagsRaw = String(formData.get('tags') || '');
  const store = String(formData.get('store') || '');
  const location = String(formData.get('location') || '');
  const priceStr = String(formData.get('price') || '').trim();
  const price = priceStr ? Number(priceStr) : null;
  const tags = tagsRaw.trim() ? tagsRaw.split(',').map((s) => s.trim()).filter((s) => s.length > 0) : null;
  const db = supabaseAdmin();
  const { data: obj } = await db.from('objects').select('id').eq('token', token).single();
  if (!obj) return;
  const update: any = {
    title: toNull(title) ?? null,
    title_ja: toNull(title_ja),
    local_number: toNull(local_number),
    summary: toNull(summary),
    summary_ja: toNull(summary_ja),
    craftsman: toNull(craftsman),
    event_date: toNull(event_date),
    notes: toNull(notes),
    url: toNull(url),
    tags,
  };
  if (okAdmin || okOwner) {
    update.store = toNull(store);
    update.location = toNull(location);
  }
  if (okOwner) {
    update.price = price;
  }
  await db.from('objects').update(update).eq('id', obj.id);
  revalidatePath(`/admin/${token}`);
}

export default async function AdminObjectPage({ params, searchParams }: { params: { token: string }, searchParams?: { [key: string]: string | string[] | undefined } }) {
  const token = params.token;
  const db = supabaseAdmin();
  const [objectCore, licensesRes, isOwner, isAdmin] = await Promise.all([
    db
      .from('objects')
      .select(
        `id, token, local_number, title, title_ja, summary, summary_ja, price, store, store_ja, location, location_ja, tags, craftsman, craftsman_ja, event_date, notes, notes_ja, url, visibility`
      )
      .eq('token', token)
      .single(),
    db.from('licenses').select('id,code,name,uri').order('code'),
    requireOwner(),
    requireAdmin(),
  ]);
  const object = objectCore?.data || null;
  const licenses = (licensesRes as any)?.data || [];
  let media: any[] = [];
  if (object?.id) {
    const [direct, links] = await Promise.all([
      db.from('media').select('id, kind, uri, sort_order, copyright_owner, rights_note, license_id, object_id').eq('object_id', object.id),
      db.from('object_media_links').select('media_id').eq('object_id', object.id),
    ]);
    const ids = new Set<string>();
    for (const m of direct.data || []) ids.add((m as any).id);
    const linkIds = (links.data || []).map((r: any) => r.media_id).filter((id: string) => !ids.has(id));
    let linked: any[] = [];
    if (linkIds.length) {
      const { data: lm } = await db.from('media').select('id, kind, uri, sort_order, copyright_owner, rights_note, license_id, object_id').in('id', linkIds);
      linked = lm || [];
    }
    media = ([...(direct.data || []), ...linked]).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }

  if (!object) return notFound();
  const saved = typeof searchParams?.saved === 'string' ? searchParams!.saved : undefined;
  const error = typeof searchParams?.error === 'string' ? searchParams!.error : undefined;

  return (
    <main className="max-w-4xl mx-auto p-6">
      {saved ? <div className="card" style={{ background: '#f0fff4', borderColor: '#bbf7d0', marginBottom: 12 }}>Saved {saved}</div> : null}
      {error ? <div className="card" style={{ background: '#fff1f2', borderColor: '#fecdd3', marginBottom: 12 }}>Error: {error}</div> : null}
      <h1 className="text-xl font-semibold mb-2">Admin: {object.title}</h1>
      {object.title_ja ? <p className="text-sm" lang="ja">{object.title_ja}</p> : null}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <section>
          <h2 className="text-lg font-semibold mb-2">Images</h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {media.map((m: any) => (
              <div key={m.id} className="card">
                <div className="relative w-full" style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', background: '#f8f8f8', borderRadius: 6, overflow: 'hidden', border: '1px solid #eee' }}>
                  <Image src={m.uri} alt={object.title} fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: 'cover' }} />
                </div>
                <form action={updateMediaAction} className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                  <input type="hidden" name="media_id" value={m.id} />
                  <input type="hidden" name="object_token" value={token} />
                  <input name="copyright_owner" className="input" placeholder="Copyright owner" defaultValue={m.copyright_owner || ''} />
                  <select name="license_id" className="input" defaultValue={m.license_id || ''}>
                    <option value="">Select license</option>
                    {(licenses ?? []).map((lic: any) => (
                      <option key={lic.id} value={lic.id}>{lic.code} — {lic.name}</option>
                    ))}
                  </select>
                  <textarea name="rights_note" className="textarea" placeholder="Rights/metadata note" defaultValue={m.rights_note || ''} />
                  <div>
                    <button className="button" type="submit">Save</button>
                  </div>
                </form>
                <form action={deleteMediaAction} className="mt-2">
                  <input type="hidden" name="media_id" value={m.id} />
                  <input type="hidden" name="object_token" value={token} />
                  <button type="submit" className="text-red-600 text-sm">Delete</button>
                </form>
              </div>
            ))}
          </div>
          <div className="mt-4 card">
            <form action={addMediaUrlAction} className="space-y-2">
              <input type="hidden" name="object_token" value={token} />
              <label className="label">Add image by URL (public)</label>
              <input name="image_url" className="input" placeholder="https://..." />
              <button className="button" type="submit">Add</button>
            </form>
            <form action={uploadMediaFileAction} className="space-y-2" style={{ marginTop: 12 }}>
              <input type="hidden" name="object_token" value={token} />
              <label className="label">Or upload file</label>
              <input name="file" type="file" className="input" />
              <button className="button" type="submit">Upload</button>
            </form>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Metadata</h2>
          <form action={updateObjectAction} className="card space-y-2">
            <input type="hidden" name="object_token" value={token} />

            <label className="label">Local number</label>
            <input name="local_number" className="input" defaultValue={object.local_number || ''} />

            <label className="label">Title (EN)</label>
            <input name="title" className="input" defaultValue={object.title || ''} />
            {object.title && !object.title_ja ? (
              <button className="button secondary" formAction={autoTranslate} name="field" value="title" type="submit" style={{ padding: '2px 6px', fontSize: 12, marginLeft: 8, marginTop: 4 }}>E → JA</button>
            ) : null}

            <label className="label">Title (JA)</label>
            <input name="title_ja" className="input" defaultValue={object.title_ja || ''} />
            {object.title_ja && !object.title ? (
              <button className="button secondary" formAction={autoTranslate} name="field" value="title_ja" type="submit" style={{ padding: '2px 6px', fontSize: 12, marginTop: 4 }}>JA → EN</button>
            ) : null}

            <label className="label">Craftsman (EN)</label>
            <input name="craftsman" className="input" defaultValue={object.craftsman || ''} />
            <label className="label">Craftsman (JA)</label>
            <input name="craftsman_ja" className="input" defaultValue={object.craftsman_ja || ''} />
            {object.craftsman && !object.craftsman_ja ? (
              <button className="button secondary" formAction={autoTranslate} name="field" value="craftsman" type="submit" style={{ padding: '2px 6px', fontSize: 12, marginTop: 4 }}>E → JA</button>
            ) : null}
            {object.craftsman_ja && !object.craftsman ? (
              <button className="button secondary" formAction={autoTranslate} name="field" value="craftsman_ja" type="submit" style={{ padding: '2px 6px', fontSize: 12, marginTop: 4 }}>JA → EN</button>
            ) : null}

            <label className="label">Date</label>
            <input name="event_date" className="input" defaultValue={object.event_date || ''} />

            <label className="label">Tags (comma separated)</label>
            <input name="tags" className="input" defaultValue={(object.tags || []).join(', ')} />

            {isOwner ? (
              <>
                <label className="label">Price</label>
                <input name="price" type="number" step="0.01" className="input" defaultValue={object.price ?? ''} />
              </>
            ) : null}

            {isAdmin ? (
              <>
                <label className="label">Store (EN)</label>
                <input name="store" className="input" defaultValue={object.store || ''} />
                <label className="label">Store (JA)</label>
                <input name="store_ja" className="input" defaultValue={object.store_ja || ''} />
                {object.store && !object.store_ja ? (
                  <button className="button secondary" formAction={autoTranslate} name="field" value="store" type="submit" style={{ padding: '2px 6px', fontSize: 12 }}>E → JA</button>
                ) : null}
                {object.store_ja && !object.store ? (
                  <button className="button secondary" formAction={autoTranslate} name="field" value="store_ja" type="submit" style={{ padding: '2px 6px', fontSize: 12 }}>JA → EN</button>
                ) : null}

                <label className="label">Location (EN)</label>
                <input name="location" className="input" defaultValue={object.location || ''} />
                <label className="label">Location (JA)</label>
                <input name="location_ja" className="input" defaultValue={object.location_ja || ''} />
                {object.location && !object.location_ja ? (
                  <button className="button secondary" formAction={autoTranslate} name="field" value="location" type="submit" style={{ padding: '2px 6px', fontSize: 12 }}>E → JA</button>
                ) : null}
                {object.location_ja && !object.location ? (
                  <button className="button secondary" formAction={autoTranslate} name="field" value="location_ja" type="submit" style={{ padding: '2px 6px', fontSize: 12 }}>JA → EN</button>
                ) : null}
              </>
            ) : null}

            <label className="label">URL</label>
            <input name="url" className="input" defaultValue={object.url || ''} />

            <label className="label">Notes (EN)</label>
            <textarea name="notes" className="textarea" defaultValue={object.notes || ''} />
            <label className="label">Notes (JA)</label>
            <textarea name="notes_ja" className="textarea" defaultValue={object.notes_ja || ''} />
            {object.notes && !object.notes_ja ? (
              <button className="button secondary" formAction={autoTranslate} name="field" value="notes" type="submit" style={{ padding: '2px 6px', fontSize: 12 }}>E → JA</button>
            ) : null}
            {object.notes_ja && !object.notes ? (
              <button className="button secondary" formAction={autoTranslate} name="field" value="notes_ja" type="submit" style={{ padding: '2px 6px', fontSize: 12 }}>JA → EN</button>
            ) : null}

            <label className="label">Summary (EN)</label>
            <textarea name="summary" className="textarea" defaultValue={object.summary || ''} />
            {object.summary && !object.summary_ja ? (
              <button className="button secondary" formAction={autoTranslate} name="field" value="summary" type="submit" style={{ padding: '2px 6px', fontSize: 12, marginTop: 4 }}>E → JA</button>
            ) : null}

            <label className="label">Summary (JA)</label>
            <textarea name="summary_ja" className="textarea" defaultValue={object.summary_ja || ''} />
            {object.summary_ja && !object.summary ? (
              <button className="button secondary" formAction={autoTranslate} name="field" value="summary_ja" type="submit" style={{ padding: '2px 6px', fontSize: 12, marginTop: 4 }}>JA → EN</button>
            ) : null}

            <div style={{ marginTop: 8 }}>
              <button className="button" type="submit">Save metadata</button>
            </div>
          </form>
        </section>

        <section>
          <h3 className="text-md font-semibold mt-4">Classifications</h3>
          <ul className="space-y-2">
            {(object.object_classifications ?? []).map((oc: any, i: number) => (
              <li key={i} className="card">
                <div className="text-sm">
                  <strong>{oc.classification?.label || oc.classification?.uri}</strong>{' '}
                  {oc.classification?.label_ja ? <span lang="ja">/ {oc.classification.label_ja}</span> : null}
                  <div className="text-xs text-gray-600">{oc.role} · {oc.classification?.scheme} · <a className="underline" href={oc.classification?.uri} target="_blank" rel="noreferrer">{oc.classification?.uri}</a></div>
                </div>
              </li>
            ))}
          </ul>

          <div className="card mt-4">
            <h4 className="text-sm font-semibold mb-2">Add classification</h4>
            <LookupPanel />
            <form id="classification-form" action={saveClassificationAction} className="space-y-2" style={{ marginTop: 8 }}>
              <input type="hidden" name="object_token" value={token} />
              <input name="scheme" className="input" placeholder="aat | wikidata" />
              <input name="uri" className="input" placeholder="http://vocab.getty.edu/aat/300266745" />
              <input name="label" className="input" placeholder="Label EN (optional)" />
              <input name="label_ja" className="input" placeholder="Label JA (optional)" />
              <input name="role" className="input" placeholder="primary type" defaultValue="primary type" />
              <button className="button" type="submit">Save classification</button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
