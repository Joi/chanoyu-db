import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { mintToken } from '@/lib/id';
import { parseSupabasePublicUrl } from '@/lib/storage';
import { translateText } from '@/lib/translate';
import { requireOwner, requireAdmin } from '@/lib/auth';
import RevealPrice from '@/app/components/RevealPrice';
import PriceInput from '@/app/components/PriceInput';
import SubmitButton from '@/app/components/SubmitButton';
import PendingProgress from '@/app/components/PendingProgress';
import SearchSelect from '@/app/components/SearchSelect';
import type { LocalClass, SelectOption } from '@/lib/types/admin';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

// Proper UUID validation schema
const uuidSchema = z.string().uuid();
const optionalUuidSchema = z.string().uuid().optional().or(z.literal(''));

// Form validation schemas
const objectUpdateSchema = z.object({
  object_token: z.string().min(1),
  title: z.string().max(255).optional(),
  title_ja: z.string().max(255).optional(),
  local_number: z.string().max(50).optional(),
  craftsman: z.string().max(255).optional(),
  craftsman_ja: z.string().max(255).optional(),
  event_date: z.string().max(50).optional(),
  notes: z.string().max(5000).optional(),
  notes_ja: z.string().max(5000).optional(),
  url: z.string().url().max(500).optional().or(z.literal('')),
  store: z.string().max(255).optional(),
  store_ja: z.string().max(255).optional(),
  location: z.string().max(255).optional(),
  location_ja: z.string().max(255).optional(),
  price: z.string().optional(),
});

// Removed direct classification add-on schema; classifications now attach to Local Classes

// Server action to save a classification for the current object token
async function savePrimaryLocalClassAction(formData: FormData) {
  'use server';
  const token = String(formData.get('object_token') || '');
  // Accept either a single-select pulldown (local_class_id) or a comma-joined hidden input (local_class_ids)
  const rawPulldown = String(formData.get('local_class_id') || '');
  const rawHidden = String(formData.get('local_class_ids') || '');
  const raw = (rawPulldown || rawHidden) as string;
  const first = raw.split(',').map((s) => s.trim()).filter(Boolean)[0] || '';
  // Use proper UUID validation
  const id: string | null = first ? (uuidSchema.safeParse(first).success ? first : null) : null;
  const db = supabaseAdmin();
  if (!token) {
    return redirect('/login');
  }
  const { data: obj, error: objErr } = await db.from('objects').select('id').eq('token', token).single();
  if (objErr || !obj) {
    const msg = objErr?.message || 'object not found';
    const detail = process.env.NODE_ENV === 'production' ? '' : `&detail=${encodeURIComponent(msg).slice(0,200)}`;
    return redirect(`/admin/${token}?error=local-class${detail}`);
  }
  if (id && uuidSchema.safeParse(id).success) {
    const { data: exists, error: existsErr } = await db.from('local_classes').select('id').eq('id', id).maybeSingle();
    if (existsErr || !exists) {
      const msg = existsErr?.message || 'local class not found';
      const detail = process.env.NODE_ENV === 'production' ? '' : `&detail=${encodeURIComponent(msg).slice(0,200)}`;
      return redirect(`/admin/${token}?error=local-class${detail}`);
    }
  }
  // Check if primary_local_class_id column exists before updating
  try {
    const { error } = await db.from('objects').update({ primary_local_class_id: id }).eq('id', obj.id);
    if (error) {
      // Handle column does not exist error specifically
      if (error.message?.includes('column "primary_local_class_id" of relation "objects" does not exist')) {
        const detail = process.env.NODE_ENV === 'production' ? '' : `&detail=${encodeURIComponent('Column primary_local_class_id missing. Run migration: alter table objects add column if not exists primary_local_class_id uuid references local_classes(id);').slice(0,200)}`;
        return redirect(`/admin/${token}?error=local-class${detail}`);
      }
      throw error;
    }
  } catch (error: any) {
    const msg = error?.message || String(error);
    const detail = process.env.NODE_ENV === 'production' ? '' : `&detail=${encodeURIComponent(`update failed: ${msg}`).slice(0,200)}`;
    return redirect(`/admin/${token}?error=local-class${detail}`);
  }
  revalidatePath(`/admin/${token}`);
  redirect(`/admin/${token}?saved=local-class`);
}

// Removed direct classification server action; objects no longer write to object_classifications from UI

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

// Mark a media as featured by setting its sort_order to 0 and bumping others
async function makeFeaturedMediaAction(formData: FormData) {
  'use server';
  const mediaId = String(formData.get('media_id') || '');
  const token = String(formData.get('object_token') || '');
  if (!mediaId || !token) return;
  const db = supabaseAdmin();
  const { data: m } = await db.from('media').select('id, object_id').eq('id', mediaId).maybeSingle();
  if (!m || !(m as any).object_id) return;
  const objectId = String((m as any).object_id);
  // Set selected to 0, others to 999
  await db.from('media').update({ sort_order: 0 }).eq('id', mediaId);
  await db.from('media').update({ sort_order: 999 }).neq('id', mediaId).eq('object_id', objectId);
  revalidatePath(`/admin/${token}`);
  redirect(`/admin/${token}?saved=featured`);
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
    .select('id, title, title_ja, craftsman, craftsman_ja, store, store_ja, location, location_ja, notes, notes_ja')
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
  const craftsman = String(formData.get('craftsman') || '');
  const craftsman_ja = String(formData.get('craftsman_ja') || '');
  const event_date = String(formData.get('event_date') || '');
  const notes = String(formData.get('notes') || '');
  const notes_ja = String(formData.get('notes_ja') || '');
  const url = String(formData.get('url') || '');
  const store = String(formData.get('store') || '');
  const store_ja = String(formData.get('store_ja') || '');
  const location = String(formData.get('location') || '');
  const location_ja = String(formData.get('location_ja') || '');
  const priceStr = String(formData.get('price') || '').trim();
  const price = priceStr ? Number(priceStr) : null;
  const db = supabaseAdmin();
  const { data: obj } = await db.from('objects').select('id').eq('token', token).single();
  if (!obj) return;
  const update: any = {
    title: toNull(title) ?? null,
    title_ja: toNull(title_ja),
    local_number: toNull(local_number),
    craftsman: toNull(craftsman),
    craftsman_ja: toNull(craftsman_ja),
    event_date: toNull(event_date),
    notes: toNull(notes),
    notes_ja: toNull(notes_ja),
    url: toNull(url),
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
        `id, token, local_number, title, title_ja, price, store, store_ja, location, location_ja, craftsman, craftsman_ja, event_date, notes, notes_ja, url, visibility,
         primary_local_class_id`
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
  // Load options for Local Class pulldown
  const { data: allLocalClasses } = await db
    .from('local_classes')
    .select('id, label_en, label_ja, local_number, sort_order')
    .order('sort_order', { ascending: true, nullsFirst: true })
    .order('local_number')
    .limit(1000);
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
      const { data: lm } = await db.from('media').select('id, token, kind, uri, sort_order, copyright_owner, rights_note, license_id, object_id, local_number').in('id', linkIds);
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
  const detail = typeof searchParams?.detail === 'string' ? searchParams!.detail : undefined;

  // Local Class breadcrumb and initial selection
  let localClassInitial: { value: string; label: string }[] = [];
  let localClassBreadcrumb: string[] = [];
  let localClassTitle: string = '';
  let localClassExternal: any[] = [];
  if (object?.primary_local_class_id) {
    const plcId = object.primary_local_class_id as string;
    const [{ data: lc }, { data: chain }] = await Promise.all([
      db.from('local_classes').select('id, token, local_number, label_en, label_ja').eq('id', plcId).maybeSingle(),
      db
        .from('local_class_hierarchy')
        .select('ancestor_id, descendant_id, depth')
        .eq('descendant_id', plcId),
    ]);
    const ancestorIds = Array.from(new Set(((chain || []) as any[]).map((r: any) => String(r.ancestor_id)).filter((aid) => aid !== plcId)));
    let ancestors: any[] = [];
    if (ancestorIds.length) {
      const { data: rows } = await db
        .from('local_classes')
        .select('id, local_number, label_en, label_ja')
        .in('id', ancestorIds);
      ancestors = rows || [];
    }
    const byId: Record<string, any> = Object.create(null);
    for (const a of ancestors) byId[String(a.id)] = a;
    const ordered = ((chain || []) as any[])
      .filter((r: any) => String(r.ancestor_id) !== plcId)
      .sort((a: any, b: any) => (a.depth - b.depth))
      .map((r: any) => byId[String(r.ancestor_id)])
      .filter(Boolean);
    const title = lc ? String(lc.label_ja || lc.label_en || lc.local_number || lc.id) : '';
    localClassInitial = lc ? [{ value: plcId, label: title }] : [];
    localClassTitle = title;
    // External links (AAT / Wikidata) for the selected Local Class
    const { data: extRows } = await db
      .from('local_class_links')
      .select('classification:classifications(id, scheme, uri, label, label_ja)')
      .eq('local_class_id', plcId);
    localClassExternal = (extRows || []).map((r: any) => r.classification).filter(Boolean);
    localClassBreadcrumb = ordered.map((a: any) => String(a.label_ja || a.label_en || a.local_number || a.id));
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      {saved ? <div className="card" style={{ background: '#f0fff4', borderColor: '#bbf7d0', marginBottom: 12 }}>Saved {saved}</div> : null}
      {error ? (
        <div className="card" style={{ background: '#fff1f2', borderColor: '#fecdd3', marginBottom: 12 }}>
          <div>Error: {error}</div>
          {detail ? <div className="text-xs text-gray-700 mt-1">{detail}</div> : null}
        </div>
      ) : null}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold">Admin: {object.title}</h1>
        <a href="/admin/items" className="text-sm underline">← Back to Items</a>
      </div>
      {object.title_ja ? <p className="text-sm" lang="ja">{object.title_ja}</p> : null}
      {/* Compact classification summary at top */}
      <section className="card mb-3">
        <h2 className="text-sm font-semibold mb-1">Classification</h2>
        <div className="grid gap-2">
          {localClassTitle ? (
            <div className="text-sm">Current: <a className="underline" href={`/admin/local-classes/${String(object.primary_local_class_id)}`}>{localClassTitle}</a></div>
          ) : (
            <div className="text-xs text-gray-600">No local class selected</div>
          )}
          {localClassBreadcrumb.length ? (
            <div className="text-xs text-gray-600">{localClassBreadcrumb.join(' / ')}</div>
          ) : null}
          {localClassExternal.length ? (
            <div className="flex flex-wrap gap-2 text-xs">
              {localClassExternal.map((c: any) => (
                <a key={String(c.id)} href={c.uri} target="_blank" rel="noreferrer" className="underline">
                  {c.scheme}: {String(c.label_ja || c.label || c.uri)}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <section>
          <h2 className="text-lg font-semibold mb-2">Images</h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {media.map((m: any, idx: number) => (
              <div key={m.id} className="card">
                <div className="relative w-full" style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', background: '#f8f8f8', borderRadius: 6, overflow: 'hidden', border: '1px solid #eee' }}>
                  <a href={`/media/${m.id}`}>
                    <Image src={m.uri} alt={object.title} fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: 'cover' }} />
                  </a>
                </div>
                <div className="mt-2 text-sm flex items-center gap-3">
                  <a className="underline" href={`/media/${m.token || m.id}`}>Open media page</a> {m.local_number ? <span> · {m.local_number}</span> : null}
                  <form action={makeFeaturedMediaAction} className="ml-auto">
                    <input type="hidden" name="media_id" value={m.id} />
                    <input type="hidden" name="object_token" value={token} />
                    <button type="submit" className="text-xs underline">{idx === 0 ? 'Featured' : 'Make featured'}</button>
                  </form>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Edit fields</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateObjectAction} className="grid gap-4">
                <input type="hidden" name="object_token" value={token} />

                <div className="grid gap-2">
                  <Label htmlFor="local_number">Local number</Label>
                  <Input id="local_number" name="local_number" defaultValue={object.local_number || ''} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title (EN)</Label>
                    <Input id="title" name="title" defaultValue={object.title || ''} />
                    {object.title && !object.title_ja ? (
                      <Button variant="secondary" size="sm" formAction={autoTranslate.bind(null, 'title')} type="submit">E → JA</Button>
                    ) : null}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="title_ja">Title (JA)</Label>
                    <Input id="title_ja" name="title_ja" defaultValue={object.title_ja || ''} />
                    {object.title_ja && !object.title ? (
                      <Button variant="secondary" size="sm" formAction={autoTranslate.bind(null, 'title_ja')} type="submit">JA → EN</Button>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="craftsman">Craftsman (EN)</Label>
                    <Input id="craftsman" name="craftsman" defaultValue={object.craftsman || ''} />
                    {object.craftsman && !object.craftsman_ja ? (
                      <Button variant="secondary" size="sm" formAction={autoTranslate.bind(null, 'craftsman')} type="submit">E → JA</Button>
                    ) : null}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="craftsman_ja">Craftsman (JA)</Label>
                    <Input id="craftsman_ja" name="craftsman_ja" defaultValue={object.craftsman_ja || ''} />
                    {object.craftsman_ja && !object.craftsman ? (
                      <Button variant="secondary" size="sm" formAction={autoTranslate.bind(null, 'craftsman_ja')} type="submit">JA → EN</Button>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="event_date">Date</Label>
                  <Input id="event_date" name="event_date" defaultValue={object.event_date || ''} />
                </div>

                {/* TEMPORARILY HIDDEN: Tag field not fully implemented yet (Issue #94)
                    TODO: Re-enable when proper tagging functionality is complete
                <div className="grid gap-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input id="tags" name="tags" defaultValue={(object.tags || []).join(', ')} />
                </div>
                */}

                {isOwner ? (
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price</Label>
                    <PriceInput defaultValue={object.price ?? ''} canEdit={true} />
                  </div>
                ) : null}

                {isAdmin ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="store">Store (EN)</Label>
                      <Input id="store" name="store" defaultValue={object.store || ''} />
                      {object.store && !object.store_ja ? (
                        <Button variant="secondary" size="sm" formAction={autoTranslate.bind(null, 'store')} type="submit">E → JA</Button>
                      ) : null}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="store_ja">Store (JA)</Label>
                      <Input id="store_ja" name="store_ja" defaultValue={object.store_ja || ''} />
                      {object.store_ja && !object.store ? (
                        <Button variant="secondary" size="sm" formAction={autoTranslate.bind(null, 'store_ja')} type="submit">JA → EN</Button>
                      ) : null}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="location">Location (EN)</Label>
                      <Input id="location" name="location" defaultValue={object.location || ''} />
                      {object.location && !object.location_ja ? (
                        <Button variant="secondary" size="sm" formAction={autoTranslate.bind(null, 'location')} type="submit">E → JA</Button>
                      ) : null}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="location_ja">Location (JA)</Label>
                      <Input id="location_ja" name="location_ja" defaultValue={object.location_ja || ''} />
                      {object.location_ja && !object.location ? (
                        <Button variant="secondary" size="sm" formAction={autoTranslate.bind(null, 'location_ja')} type="submit">JA → EN</Button>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-2">
                  <Label htmlFor="url">URL</Label>
                  <Input id="url" name="url" defaultValue={object.url || ''} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes (EN)</Label>
                    <Textarea id="notes" name="notes" defaultValue={object.notes || ''} />
                    {object.notes && !object.notes_ja ? (
                      <Button variant="secondary" size="sm" formAction={autoTranslate.bind(null, 'notes')} type="submit">E → JA</Button>
                    ) : null}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes_ja">Notes (JA)</Label>
                    <Textarea id="notes_ja" name="notes_ja" defaultValue={object.notes_ja || ''} />
                    {object.notes_ja && !object.notes ? (
                      <Button variant="secondary" size="sm" formAction={autoTranslate.bind(null, 'notes_ja')} type="submit">JA → EN</Button>
                    ) : null}
                  </div>
                </div>

                <div className="pt-2">
                  <SubmitButton label="Save metadata" pendingLabel="Saving..." />
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        {/* Removed direct per-object classification UI; prefer Local Class links */}

        <div>
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
                <div className="flex justify-end">
                  <SubmitButton label="Save" pendingLabel="Saving..." />
                </div>
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

          <section className="card mt-4">
            <h3 className="text-md font-semibold mb-3">Primary Local Class</h3>
            <form action={savePrimaryLocalClassAction} className="grid gap-3">
              <input type="hidden" name="object_token" value={token} />
              <select name="local_class_id" className="input" defaultValue={object.primary_local_class_id || ''}>
                <option value="">(none)</option>
                {(allLocalClasses || []).map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.label_ja || c.label_en || c.local_number || c.id}
                  </option>
                ))}
              </select>
              <div className="flex justify-end">
                <SubmitButton label="Save" pendingLabel="Saving..." />
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
