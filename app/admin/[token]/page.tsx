import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { mintToken } from '@/lib/id';
import { parseSupabasePublicUrl } from '@/lib/storage';
import { translateText } from '@/lib/translate';
import LookupPanel from './lookup-panel';
import { requireOwner, requireAdmin } from '@/lib/auth';
import RevealPrice from '@/app/components/RevealPrice';
import PriceInput from '@/app/components/PriceInput';
import SubmitButton from '@/app/components/SubmitButton';
import PendingProgress from '@/app/components/PendingProgress';
import SearchSelect from '@/app/components/SearchSelect';
import { z } from 'zod';

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
  const parse = z
    .object({ object_token: z.string().min(1), image_url: z.string().url().min(1).max(2048) })
    .safeParse({
      object_token: String(formData.get('object_token') || ''),
      image_url: String(formData.get('image_url') || '').trim(),
    });
  const token = parse.success ? parse.data.object_token : '';
  const url = parse.success ? parse.data.image_url : '';
  const db = supabaseAdmin();
  try {
    console.log('[media:url] start', { token, url });
    if (!token || !url) throw new Error('missing token|url');
    const { data: obj, error: eObj } = await db.from('objects').select('id').eq('token', token).single();
    if (eObj || !obj) throw eObj || new Error('object not found');
    const { error: eIns } = await db.from('media').insert({ object_id: obj.id, uri: url, kind: 'image', sort_order: 999, token: mintToken() });
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
      const b = await (db as any).storage.getBucket('media');
      const exists = b && !b.error && b.data != null;
      if (!exists) throw new Error('media bucket missing');
    } catch (e: any) {
      console.error('[media:upload] ensure bucket error', e?.message || e);
      throw new Error('media bucket missing');
    }
    const arrayBuffer = await file.arrayBuffer();
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
    const filename = `${mintToken(6)}.${ext}`;
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
    const { error: eIns } = await db.from('media').insert({ object_id: obj.id, uri, kind: 'image', sort_order: 999, token: mintToken() });
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

async function autoTranslate(field: string, formData: FormData) {
  'use server';
  const token = String(formData.get('object_token') || '');
  const db = supabaseAdmin();
  const { data } = await db
    .from('objects')
    .select('id, title, title_ja, summary, summary_ja, craftsman, craftsman_ja, store, store_ja, location, location_ja, notes, notes_ja')
    .eq('token', token)
    .single();
  if (!data) return;
  console.log('[autoTranslate] start', { token, field });

  const updates: Record<string, string> = {};
  const translatePair = async (
    srcKey: keyof typeof data,
    dstKey: keyof typeof data,
    srcLang: 'en' | 'ja',
    dstLang: 'en' | 'ja'
  ) => {
    const srcVal = (data as any)[srcKey];
    const dstVal = (data as any)[dstKey];
    if (srcVal && !dstVal) {
      const t = await translateText(String(srcVal), dstLang, srcLang);
      if (t) updates[dstKey as string] = t;
    }
  };

  // If a specific field initiated the translation, scope to that direction only
  switch (field) {
    case 'title':
      console.log('[autoTranslate] attempt pair', { src: 'title', dst: 'title_ja', srcHas: !!(data as any).title, dstHas: !!(data as any).title_ja });
      await translatePair('title', 'title_ja', 'en', 'ja');
      break;
    case 'title_ja':
      console.log('[autoTranslate] attempt pair', { src: 'title_ja', dst: 'title', srcHas: !!(data as any).title_ja, dstHas: !!(data as any).title });
      await translatePair('title_ja', 'title', 'ja', 'en');
      break;
    case 'summary':
      console.log('[autoTranslate] attempt pair', { src: 'summary', dst: 'summary_ja', srcHas: !!(data as any).summary, dstHas: !!(data as any).summary_ja });
      await translatePair('summary', 'summary_ja', 'en', 'ja');
      break;
    case 'summary_ja':
      console.log('[autoTranslate] attempt pair', { src: 'summary_ja', dst: 'summary', srcHas: !!(data as any).summary_ja, dstHas: !!(data as any).summary });
      await translatePair('summary_ja', 'summary', 'ja', 'en');
      break;
    case 'craftsman':
      console.log('[autoTranslate] attempt pair', { src: 'craftsman', dst: 'craftsman_ja', srcHas: !!(data as any).craftsman, dstHas: !!(data as any).craftsman_ja });
      await translatePair('craftsman', 'craftsman_ja', 'en', 'ja');
      break;
    case 'craftsman_ja':
      console.log('[autoTranslate] attempt pair', { src: 'craftsman_ja', dst: 'craftsman', srcHas: !!(data as any).craftsman_ja, dstHas: !!(data as any).craftsman });
      await translatePair('craftsman_ja', 'craftsman', 'ja', 'en');
      break;
    case 'store':
      console.log('[autoTranslate] attempt pair', { src: 'store', dst: 'store_ja', srcHas: !!(data as any).store, dstHas: !!(data as any).store_ja });
      await translatePair('store', 'store_ja', 'en', 'ja');
      break;
    case 'store_ja':
      console.log('[autoTranslate] attempt pair', { src: 'store_ja', dst: 'store', srcHas: !!(data as any).store_ja, dstHas: !!(data as any).store });
      await translatePair('store_ja', 'store', 'ja', 'en');
      break;
    case 'location':
      console.log('[autoTranslate] attempt pair', { src: 'location', dst: 'location_ja', srcHas: !!(data as any).location, dstHas: !!(data as any).location_ja });
      await translatePair('location', 'location_ja', 'en', 'ja');
      break;
    case 'location_ja':
      console.log('[autoTranslate] attempt pair', { src: 'location_ja', dst: 'location', srcHas: !!(data as any).location_ja, dstHas: !!(data as any).location });
      await translatePair('location_ja', 'location', 'ja', 'en');
      break;
    case 'notes':
      console.log('[autoTranslate] attempt pair', { src: 'notes', dst: 'notes_ja', srcHas: !!(data as any).notes, dstHas: !!(data as any).notes_ja });
      await translatePair('notes', 'notes_ja', 'en', 'ja');
      break;
    case 'notes_ja':
      console.log('[autoTranslate] attempt pair', { src: 'notes_ja', dst: 'notes', srcHas: !!(data as any).notes_ja, dstHas: !!(data as any).notes });
      await translatePair('notes_ja', 'notes', 'ja', 'en');
      break;
    default:
      // Fallback: try all pairs if no specific field provided
      await translatePair('title','title_ja','en','ja');
      await translatePair('title_ja','title','ja','en');
      await translatePair('summary','summary_ja','en','ja');
      await translatePair('summary_ja','summary','ja','en');
      await translatePair('craftsman','craftsman_ja','en','ja');
      await translatePair('craftsman_ja','craftsman','ja','en');
      await translatePair('store','store_ja','en','ja');
      await translatePair('store_ja','store','ja','en');
      await translatePair('location','location_ja','en','ja');
      await translatePair('location_ja','location','ja','en');
      await translatePair('notes','notes_ja','en','ja');
      await translatePair('notes_ja','notes','ja','en');
  }
  console.log('[autoTranslate] updates', Object.keys(updates));

  if (Object.keys(updates).length > 0) {
    const res = await db.from('objects').update(updates).eq('id', data.id).select('id');
    if ((res as any)?.error) {
      console.log('[autoTranslate] update error', (res as any).error?.message || (res as any).error);
    } else {
      console.log('[autoTranslate] update ok for', data.id);
    }
  } else {
    console.log('[autoTranslate] no updates to apply');
  }
  revalidatePath(`/admin/${token}`);
  redirect(`/admin/${token}?saved=translate${field ? `&field=${encodeURIComponent(field)}` : ''}`);
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
  const craftsman_ja = String(formData.get('craftsman_ja') || '');
  const event_date = String(formData.get('event_date') || '');
  const notes = String(formData.get('notes') || '');
  const notes_ja = String(formData.get('notes_ja') || '');
  const url = String(formData.get('url') || '');
  const tagsRaw = String(formData.get('tags') || '');
  const store = String(formData.get('store') || '');
  const store_ja = String(formData.get('store_ja') || '');
  const location = String(formData.get('location') || '');
  const location_ja = String(formData.get('location_ja') || '');
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
    craftsman_ja: toNull(craftsman_ja),
    event_date: toNull(event_date),
    notes: toNull(notes),
    notes_ja: toNull(notes_ja),
    url: toNull(url),
    tags,
  };
  if (okAdmin || okOwner) {
    update.store = toNull(store);
    update.store_ja = toNull(store_ja);
    update.location = toNull(location);
    update.location_ja = toNull(location_ja);
  }
  if (okOwner) {
    update.price = price;
  }
  await db.from('objects').update(update).eq('id', obj.id);
  revalidatePath(`/admin/${token}`);
}

// Link/unlink this object to selected Chakai events
async function updateObjectChakaiLinks(formData: FormData) {
  'use server';
  const token = String(formData.get('object_token') || '');
  if (!token) return;
  const db = supabaseAdmin();
  const { data: obj } = await db.from('objects').select('id').eq('token', token).single();
  if (!obj) return;
  const raw = String(formData.get('chakai_ids') || '');
  const ids = raw.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
  const del = await db.from('chakai_items').delete().eq('object_id', obj.id);
  if (del.error) throw del.error;
  if (ids.length) {
    const ins = await db.from('chakai_items').insert(ids.map((cid) => ({ chakai_id: cid, object_id: obj.id })));
    if (ins.error) throw ins.error;
  }
  revalidatePath(`/admin/${token}`);
  redirect(`/admin/${token}?saved=chakai-links`);
}

export default async function AdminObjectPage({ params, searchParams }: { params: { token: string }, searchParams?: { [key: string]: string | string[] | undefined } }) {
  const token = params.token;
  const db = supabaseAdmin();
  const [objectCore, licensesRes, isOwner, isAdmin] = await Promise.all([
    db
      .from('objects')
      .select(
        `id, token, local_number, title, title_ja, summary, summary_ja, price, store, store_ja, location, location_ja, tags, craftsman, craftsman_ja, event_date, notes, notes_ja, url, visibility,
         object_classifications:object_classifications(role,
           classification:classifications(id, scheme, uri, label, label_ja)
         )`
      )
      .eq('token', token)
      .single(),
    db.from('licenses').select('id,code,name,uri').order('code'),
    requireOwner(),
    requireAdmin(),
  ]);
  const object = objectCore?.data || null;
  const licenses = (licensesRes as any)?.data || [];
  if (!isAdmin) return redirect('/login');
  let media: any[] = [];
  if (object?.id) {
    const [direct, links] = await Promise.all([
      db.from('media').select('id, token, kind, uri, sort_order, copyright_owner, rights_note, license_id, object_id, local_number').eq('object_id', object.id),
      db.from('object_media_links').select('media_id').eq('object_id', object.id),
    ]);
    const ids = new Set<string>();
    for (const m of direct.data || []) ids.add((m as any).id);
    const linkIds = (links.data || []).map((r: any) => r.media_id).filter((id: string) => !ids.has(id));
    let linked: any[] = [];
    if (linkIds.length) {
      const { data: lm } = await db.from('media').select('id, token, kind, uri, sort_order, copyright_owner, rights_note, license_id, object_id').in('id', linkIds);
      linked = lm || [];
    }
    media = ([...(direct.data || []), ...linked]).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }

  // Existing Chakai links for this object
  let chakaiList: any[] = [];
  let chakaiInitial: { value: string; label: string }[] = [];
  if (object?.id) {
    const { data: rows } = await db
      .from('chakai_items')
      .select('chakai(id, name_en, name_ja, local_number, event_date)')
      .eq('object_id', object.id);
    const list = (rows || []).map((r: any) => r.chakai).filter(Boolean);
    chakaiList = list;
    chakaiInitial = list.map((c: any) => ({ value: c.id, label: (c.name_ja || c.name_en || c.local_number || '') }));
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
                  <a href={`/media/${m.id}`}>
                    <Image src={m.uri} alt={object.title} fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: 'cover' }} />
                  </a>
                </div>
                <div className="mt-2 text-sm">
                  <a className="underline" href={`/media/${m.token || m.id}`}>Open media page</a> {m.local_number ? <span> · {m.local_number}</span> : null}
                </div>
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
              <SubmitButton label="Add" pendingLabel="Adding..." />
            </form>
            <form action={uploadMediaFileAction} className="space-y-2" style={{ marginTop: 12 }}>
              <input type="hidden" name="object_token" value={token} />
              <label className="label">Or upload image</label>
              <div className="flex items-center gap-2">
                <label htmlFor={`file-upload-${token}`} className="button file-choose small">Choose file</label>
                <input id={`file-upload-${token}`} name="file" type="file" accept="image/*" className="sr-only" />
                <span className="text-xs text-gray-600">Select an image, then click Upload</span>
              </div>
              <PendingProgress className="mt-1" />
              <SubmitButton label="Upload" pendingLabel="Uploading..." />
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
              <button className="button secondary" formAction={autoTranslate.bind(null, 'title')} type="submit" style={{ padding: '2px 6px', fontSize: 12, marginLeft: 8, marginTop: 4 }}>E → JA</button>
            ) : null}

            <label className="label">Title (JA)</label>
            <input name="title_ja" className="input" defaultValue={object.title_ja || ''} />
            {object.title_ja && !object.title ? (
              <button className="button secondary" formAction={autoTranslate.bind(null, 'title_ja')} type="submit" style={{ padding: '2px 6px', fontSize: 12, marginTop: 4 }}>JA → EN</button>
            ) : null}

            <label className="label">Craftsman (EN)</label>
            <input name="craftsman" className="input" defaultValue={object.craftsman || ''} />
            <label className="label">Craftsman (JA)</label>
            <input name="craftsman_ja" className="input" defaultValue={object.craftsman_ja || ''} />
            {object.craftsman && !object.craftsman_ja ? (
              <button className="button secondary" formAction={autoTranslate.bind(null, 'craftsman')} type="submit" style={{ padding: '2px 6px', fontSize: 12, marginTop: 4 }}>E → JA</button>
            ) : null}
            {object.craftsman_ja && !object.craftsman ? (
              <button className="button secondary" formAction={autoTranslate.bind(null, 'craftsman_ja')} type="submit" style={{ padding: '2px 6px', fontSize: 12, marginTop: 4 }}>JA → EN</button>
            ) : null}

            <label className="label">Date</label>
            <input name="event_date" className="input" defaultValue={object.event_date || ''} />

            <label className="label">Tags (comma separated)</label>
            <input name="tags" className="input" defaultValue={(object.tags || []).join(', ')} />

            {isOwner ? (
              <>
                <label className="label">Price</label>
                <PriceInput defaultValue={object.price ?? ''} />
              </>
            ) : null}

            {isAdmin ? (
              <>
                <label className="label">Store (EN)</label>
                <input name="store" className="input" defaultValue={object.store || ''} />
                <label className="label">Store (JA)</label>
                <input name="store_ja" className="input" defaultValue={object.store_ja || ''} />
                {object.store && !object.store_ja ? (
                  <button className="button secondary" formAction={autoTranslate.bind(null, 'store')} type="submit" style={{ padding: '2px 6px', fontSize: 12 }}>E → JA</button>
                ) : null}
                {object.store_ja && !object.store ? (
                  <button className="button secondary" formAction={autoTranslate.bind(null, 'store_ja')} type="submit" style={{ padding: '2px 6px', fontSize: 12 }}>JA → EN</button>
                ) : null}

                <label className="label">Location (EN)</label>
                <input name="location" className="input" defaultValue={object.location || ''} />
                <label className="label">Location (JA)</label>
                <input name="location_ja" className="input" defaultValue={object.location_ja || ''} />
                {object.location && !object.location_ja ? (
                  <button className="button secondary" formAction={autoTranslate.bind(null, 'location')} type="submit" style={{ padding: '2px 6px', fontSize: 12 }}>E → JA</button>
                ) : null}
                {object.location_ja && !object.location ? (
                  <button className="button secondary" formAction={autoTranslate.bind(null, 'location_ja')} type="submit" style={{ padding: '2px 6px', fontSize: 12 }}>JA → EN</button>
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
              <button className="button secondary" formAction={autoTranslate.bind(null, 'notes')} type="submit" style={{ padding: '2px 6px', fontSize: 12 }}>E → JA</button>
            ) : null}
            {object.notes_ja && !object.notes ? (
              <button className="button secondary" formAction={autoTranslate.bind(null, 'notes_ja')} type="submit" style={{ padding: '2px 6px', fontSize: 12 }}>JA → EN</button>
            ) : null}

            <label className="label">Summary (EN)</label>
            <textarea name="summary" className="textarea" defaultValue={object.summary || ''} />
            {object.summary && !object.summary_ja ? (
              <button className="button secondary" formAction={autoTranslate.bind(null, 'summary')} type="submit" style={{ padding: '2px 6px', fontSize: 12, marginTop: 4 }}>E → JA</button>
            ) : null}

            <label className="label">Summary (JA)</label>
            <textarea name="summary_ja" className="textarea" defaultValue={object.summary_ja || ''} />
            {object.summary_ja && !object.summary ? (
              <button className="button secondary" formAction={autoTranslate.bind(null, 'summary_ja')} type="submit" style={{ padding: '2px 6px', fontSize: 12, marginTop: 4 }}>JA → EN</button>
            ) : null}

            <div style={{ marginTop: 8 }}>
              <SubmitButton label="Save metadata" pendingLabel="Saving..." />
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
              <SubmitButton label="Save classification" pendingLabel="Saving..." />
            </form>
          </div>
        </section>

        <section>
          <h3 className="text-md font-semibold mt-4">Chakai</h3>
          <form action={updateObjectChakaiLinks} className="card">
            <input type="hidden" name="object_token" value={token} />
            <div className="grid gap-2">
              <SearchSelect
                name="chakai_ids"
                label="Select Chakai events"
                searchPath="/api/search/chakai"
                valueKey="id"
                labelFields={["name_ja","name_en","local_number"]}
                initial={chakaiInitial}
              />
              <SubmitButton label="Save" pendingLabel="Saving..." />
            </div>
          </form>
          {chakaiList.length ? (
            <div className="mt-2 grid" style={{ gap: 8 }}>
              {chakaiList.map((c: any) => {
                const title = c.name_ja || c.name_en || '(untitled)';
                return (
                  <div key={c.id} className="text-sm">
                    <a className="underline" href={`/chakai/${(c as any).token || c.id}`}>{title}{c.local_number ? ` (${c.local_number})` : ''}</a>
                    <a className="underline ml-2 text-xs" href={`/admin/chakai/${c.id}`}>Edit</a>
                  </div>
                );
              })}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
