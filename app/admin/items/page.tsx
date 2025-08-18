import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { fetchAATPreferredLabels } from '@/lib/aat';
import { requireAdmin, requireOwner } from '@/lib/auth';
import CopyUrlButton from '@/app/admin/components/CopyUrlButton';

export const dynamic = 'force-dynamic';

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

export default async function ItemsPage() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return redirect('/login');
  const isOwner = await requireOwner();
  const db = supabaseAdmin();
  const { data: objs, error: eObjs, count } = await db
    .from('objects')
    .select(`
      id, token, title, title_ja,
      object_classifications:object_classifications(role,
        classification:classifications(id, scheme, uri, label, label_ja)
      )
    `, { count: 'exact' })
    .order('updated_at', { ascending: false })
    .limit(200);
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

  // Pre-compute primary classification labels per object (AAT preferred)
  const primaryLabelsByObjectId: Record<string, { id?: string; en?: string; ja?: string; uri?: string } | null> = {};
  await Promise.all(
    objectList.map(async (o: any) => {
      const ocs = (o.object_classifications || []) as any[];
      const primaryCandidates = ocs
        .filter((oc: any) => (oc as any).role === 'primary type')
        .map((oc: any) => (oc as any).classification)
        .filter(Boolean);
      const primaryCls = primaryCandidates.find((c: any) => c.scheme === 'aat')
        || primaryCandidates.find((c: any) => c.scheme === 'wikidata')
        || primaryCandidates[0];
      if (!primaryCls) {
        primaryLabelsByObjectId[o.id] = null;
        return;
      }
      let en = (primaryCls?.label as string | undefined) || undefined;
      let ja = (primaryCls?.label_ja as string | undefined) || undefined;
      if ((!en && !ja) && primaryCls.scheme === 'aat' && primaryCls.uri) {
        const labels = await fetchAATPreferredLabels(primaryCls.uri as string);
        en = labels.en;
        ja = labels.ja;
      }
      primaryLabelsByObjectId[o.id] = { id: primaryCls?.id as string | undefined, en, ja, uri: primaryCls?.uri as string | undefined };
    })
  );

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Items</h1>
      {!objectList.length ? (
        <div className="card" style={{ background: '#fff7ed', borderColor: '#fed7aa', marginBottom: 12 }}>
          {typeof count === 'number' ? `No items found (count=${count}).` : 'No items to display.'} Try refreshing or ingesting from Notion.
        </div>
      ) : null}
      <div className="grid" style={{ gap: 12 }}>
        {objectList.map((o: any) => {
          const mediaSorted = (mediaByObject[o.id] || []).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          const primaryMedia = mediaSorted[0] as any;
          const thumb = primaryMedia?.uri;
          const primary = primaryLabelsByObjectId[o.id];
          const primaryLabelEn = primary?.en;
          const primaryLabelJa = primary?.ja;
          const primaryUri = primary?.uri;
          const primaryId = primary?.id;

          return (
            <div key={o.id} className="card" style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12, alignItems: 'center' }}>
              <a href={primaryMedia ? `/media/${primaryMedia.id}` : '#'} title="Open media" style={{ display: 'block' }}>
                <div style={{ position: 'relative', width: 80, height: 54, background: '#f5f5f5', border: '1px solid #eee', borderRadius: 6, overflow: 'hidden' }}>
                  {thumb ? <Image src={thumb} alt={o.title} fill sizes="80px" style={{ objectFit: 'cover' }} /> : null}
                </div>
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <a href={`/admin/${o.token}`} className="text-sm font-semibold underline">{o.title || o.title_ja || o.token}</a>
                {o.title && o.title_ja ? <span className="text-sm" lang="ja">/ {o.title_ja}</span> : null}
                {primary ? (
                  <span className="text-xs text-gray-600">
                    · <a className="underline" href={`/admin/classifications/${primaryId || ''}`}>{primaryLabelEn || (!primaryLabelJa ? (primaryUri as string) : '')}</a>
                    {primaryLabelEn && primaryLabelJa ? ' / ' : ''}
                    {primaryLabelJa ? <a className="underline" href={`/admin/classifications/${primaryId || ''}`} lang="ja">{primaryLabelJa}</a> : null}
                    {!primaryLabelEn && !primaryLabelJa ? <a className="underline" href={`/admin/classifications/${primaryId || ''}`}>{primaryUri as string}</a> : ''}
                  </span>
                ) : null}
                <a href={`/id/${o.token}`} className="text-xs underline" style={{ marginLeft: 'auto' }}>View</a>
                <a href={`/admin/${o.token}`} className="text-xs underline">Edit</a>
                <CopyUrlButton path={`/id/${o.token}`} />
                {isOwner ? (
                  <form action={deleteItem}>
                    <input type="hidden" name="object_id" value={o.id} />
                    <button className="text-red-600 text-xs" type="submit">Delete</button>
                  </form>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
