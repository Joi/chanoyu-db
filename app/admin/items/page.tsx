import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin, requireOwner } from '@/lib/auth';
import { parseSupabasePublicUrl } from '@/lib/storage';
import RevealPrice from '@/app/components/RevealPrice';

async function addImage(formData: FormData) {
  'use server';
  const token = String(formData.get('token') || '');
  const url = String(formData.get('image_url') || '').trim();
  if (!token || !url) return;
  const db = supabaseAdmin();
  const { data: obj } = await db.from('objects').select('id').eq('token', token).single();
  if (!obj) return;
  await db.from('media').insert({ object_id: obj.id, uri: url, kind: 'image', sort_order: 999 });
  revalidatePath('/admin/items');
}

async function deleteImage(formData: FormData) {
  'use server';
  const mediaId = String(formData.get('media_id') || '');
  if (!mediaId) return;
  const db = supabaseAdmin();
  const { data } = await db.from('media').select('id, uri').eq('id', mediaId).single();
  if (data) {
    const parsed = parseSupabasePublicUrl(data.uri);
    if (parsed) {
      try {
        // @ts-ignore
        await (db as any).storage.from(parsed.bucket).remove([parsed.path]);
      } catch {}
    }
    await db.from('media').delete().eq('id', mediaId);
  }
  revalidatePath('/admin/items');
}

async function makePrimary(formData: FormData) {
  'use server';
  const mediaId = String(formData.get('media_id') || '');
  const objectId = String(formData.get('object_id') || '');
  if (!mediaId || !objectId) return;
  const db = supabaseAdmin();
  await db.from('media').update({ sort_order: 0 }).eq('id', mediaId);
  await db.from('media').update({ sort_order: 999 }).neq('id', mediaId).eq('object_id', objectId);
  revalidatePath('/admin/items');
}

async function deleteItem(formData: FormData) {
  'use server';
  const isOwner = await requireOwner();
  if (!isOwner) return notFound();
  const id = String(formData.get('object_id') || '');
  if (!id) return;
  const db = supabaseAdmin();
  await db.from('objects').delete().eq('id', id);
  revalidatePath('/admin/items');
}

async function assignLocalClass(formData: FormData) {
  'use server';
  const isAdmin = await requireAdmin();
  if (!isAdmin) return redirect('/login');
  const objectId = String(formData.get('object_id') || '');
  const localClassId = String(formData.get('local_class_id') || '').trim();
  if (!objectId) return;
  const db = supabaseAdmin();
  
  // Set to null if empty string is provided
  const classId = localClassId || null;
  
  await db.from('objects').update({ primary_local_class_id: classId }).eq('id', objectId);
  revalidatePath('/admin/items');
}

export default async function ItemsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return redirect('/login');
  const isOwner = await requireOwner();
  const db = supabaseAdmin();
  const [{ data: objs, error: eObjs, count }, { data: localClasses }] = await Promise.all([
    db
      .from('objects')
      .select('id, token, title, title_ja, local_number, price, store, location, primary_local_class_id', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .limit(200),
    db
      .from('local_classes')
      .select('id, label_en, label_ja, local_number')
      .order('sort_order', { ascending: true, nullsFirst: true })
      .order('local_number')
  ]);
  if (eObjs) console.error('[admin/items] query error', eObjs.message || eObjs);
  const objectList = Array.isArray(objs) ? objs : [];
  const ids = objectList.map((o: any) => o.id);
  let mediaByObject: Record<string, any[]> = {};
  if (ids.length) {
    const { data: mediaRows, error: eMed } = await db
      .from('media')
      .select('id, uri, sort_order, object_id')
      .in('object_id', ids);
    if (eMed) console.error('[admin/items] media query error', eMed.message || eMed);
    for (const m of mediaRows || []) {
      const oid = (m as any).object_id as string;
      if (!mediaByObject[oid]) mediaByObject[oid] = [];
      mediaByObject[oid].push(m);
    }
  }

  const modeRaw = typeof searchParams?.mode === 'string' ? String(searchParams!.mode) : '';
  const mode = modeRaw === 'gallery' ? 'gallery' : 'compact';

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Items</h1>
      <nav className="mb-4" style={{ display: 'flex', gap: 12 }}>
        <a className={mode === 'compact' ? 'underline' : ''} href="/admin/items?mode=compact">Compact list</a>
        <a className={mode === 'gallery' ? 'underline' : ''} href="/admin/items?mode=gallery">Gallery list</a>
      </nav>
      {!objectList.length ? (
        <div className="card" style={{ background: '#fff7ed', borderColor: '#fed7aa', marginBottom: 12 }}>
          {typeof count === 'number' ? `No items found (count=${count}).` : 'No items to display.'} Try refreshing or ingesting from Notion.
        </div>
      ) : null}
      {mode === 'compact' ? (
        <div className="grid" style={{ gap: 8 }}>
          {objectList.map((o: any) => {
            const mediaSorted = (mediaByObject[o.id] || []).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
            const primary = mediaSorted[0];
            const thumb = primary?.uri;
            return (
              <div key={o.id} className="card" style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12, alignItems: 'center' }}>
                <div style={{ position: 'relative', width: 80, height: 54, background: '#f5f5f5', border: '1px solid #eee', borderRadius: 6, overflow: 'hidden' }}>
                  {thumb ? <Image src={thumb} alt={o.title} fill sizes="80px" style={{ objectFit: 'cover' }} /> : null}
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <a href={`/id/${o.token}`} className="text-sm font-semibold underline">{o.title || o.title_ja || o.local_number || o.token}</a>
                    {o.title && o.title_ja ? <span className="text-sm" lang="ja">/ {o.title_ja}</span> : null}
                    <span className="text-xs text-gray-600">· Token: {o.token}</span>
                    <a href={`/id/${o.token}`} className="text-xs underline" style={{ marginLeft: 'auto' }}>View</a>
                    <a href={`/admin/${o.token}`} className="text-xs underline">Edit</a>
                    {isOwner ? (
                      <form action={deleteItem}>
                        <input type="hidden" name="object_id" value={o.id} />
                        <button className="text-red-600 text-xs" type="submit">Delete</button>
                      </form>
                    ) : null}
                  </div>
                  <form action={assignLocalClass} className="flex items-center gap-2">
                    <input type="hidden" name="object_id" value={o.id} />
                    <label className="text-xs text-gray-600">Local Class:</label>
                    <select name="local_class_id" className="input" style={{ fontSize: '11px', padding: '1px 4px' }} defaultValue={o.primary_local_class_id || ''}>
                      <option value="">(none)</option>
                      {(localClasses || []).map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.label_ja || c.label_en || c.local_number || c.id}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="button secondary" style={{ fontSize: '11px', padding: '1px 6px' }}>Save</button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid" style={{ gap: 12 }}>
          {objectList.map((o: any) => {
            const mediaSorted = (mediaByObject[o.id] || []).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
            const thumb = mediaSorted[0]?.uri;
            return (
              <div key={o.id} className="card" style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12 }}>
                <div>
                  <div style={{ position: 'relative', width: 120, height: 120, background: '#f5f5f5', border: '1px solid #eee', borderRadius: 6, overflow: 'hidden' }}>
                    {thumb ? <Image src={thumb} alt={o.title} fill sizes="120px" style={{ objectFit: 'cover' }} /> : null}
                  </div>
                  <form action={addImage} className="mt-2">
                    <input type="hidden" name="token" value={o.token} />
                    <input name="image_url" className="input" placeholder="Add image URL" />
                    <button className="button" type="submit" style={{ marginTop: 6 }}>Add</button>
                  </form>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <a href={`/id/${o.token}`} className="text-sm font-semibold underline">{o.title || o.local_number || '(untitled)'}</a>
                    {o.title_ja ? <span className="text-sm" lang="ja">/ {o.title_ja}</span> : null}
                    <span className="text-xs text-gray-600">· Token: {o.token}</span>
                    <a href={`/id/${o.token}`} className="text-xs underline" style={{ marginLeft: 'auto' }}>View</a>
                    <a href={`/admin/${o.token}`} className="text-xs underline">Edit</a>
                    {isOwner ? (
                      <form action={deleteItem}>
                        <input type="hidden" name="object_id" value={o.id} />
                        <button className="text-red-600 text-xs" type="submit">Delete</button>
                      </form>
                    ) : null}
                  </div>
                  <div className="text-xs text-gray-600" style={{ marginBottom: 8 }}>
                    {isOwner ? (
                      <span>
                        Price: <RevealPrice price={o.price != null ? Number(o.price) : null} /> ·
                      </span>
                    ) : null}
                    <span>Store: {o.store ?? '—'} · Location: {o.location ?? '—'}</span>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <form action={assignLocalClass} className="flex items-center gap-2">
                      <input type="hidden" name="object_id" value={o.id} />
                      <label className="text-xs text-gray-600">Local Class:</label>
                      <select name="local_class_id" className="input" style={{ fontSize: '12px', padding: '2px 6px' }} defaultValue={o.primary_local_class_id || ''}>
                        <option value="">(none)</option>
                        {(localClasses || []).map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.label_ja || c.label_en || c.local_number || c.id}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="button secondary" style={{ fontSize: '12px', padding: '2px 8px' }}>Save</button>
                    </form>
                  </div>
                  <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {mediaSorted.slice(0, 12).map((m: any) => (
                      <div key={m.id} className="card">
                        <div style={{ position: 'relative', width: '100%', paddingTop: '66%', background: '#f5f5f5', border: '1px solid #eee', borderRadius: 6, overflow: 'hidden' }}>
                          {m.uri ? <Image src={m.uri} alt={o.title} fill sizes="160px" style={{ objectFit: 'cover' }} /> : null}
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                          <form action={makePrimary}>
                            <input type="hidden" name="media_id" value={m.id} />
                            <input type="hidden" name="object_id" value={o.id} />
                            <button className="button secondary" type="submit">Make primary</button>
                          </form>
                          <form action={deleteImage}>
                            <input type="hidden" name="media_id" value={m.id} />
                            <button className="text-red-600 text-sm" type="submit">Delete</button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
