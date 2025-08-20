import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { buildLinkedArtJSONLD } from '@/lib/jsonld';
import RevealPrice from '@/app/components/RevealPrice';
// import { makeSupabaseThumbUrl } from '@/lib/storage';
import { requireAdmin, requireOwner } from '@/lib/auth';

type Props = { params: { token: string } };

export default async function ObjectPage({ params }: Props) {
  const { token } = params;

  const db = supabaseAdmin();
  // Fetch object core fields first (avoid ambiguous media join)
  const { data, error } = await db
    .from('objects')
    .select(
      `id, token, local_number, title, title_ja, summary, summary_ja, visibility,
       price, store, store_ja, location, location_ja, tags, craftsman, craftsman_ja, event_date, notes, notes_ja, url,
       object_classifications:object_classifications(role,
         classification:classifications(id, scheme, uri, label, label_ja)
       )`
    )
    .eq('token', token)
    .single();

  // If not an object token, try locations (tea rooms) or chakai and redirect
  if (error || !data || data.visibility !== 'public') {
    // Tea room by token → redirect to tea room page
    const { data: loc } = await db
      .from('locations')
      .select('id, token')
      .eq('token', token)
      .maybeSingle();
    if (loc?.id) {
      return redirect(`/tea-rooms/${loc.id}`);
    }
    // Chakai by token → redirect to chakai page
    const { data: ck } = await db
      .from('chakai')
      .select('id, token')
      .eq('token', token)
      .maybeSingle();
    if (ck?.id) {
      return redirect(`/chakai/${ck.id}`);
    }
    return notFound();
  }

  const [isOwner, isAdmin] = await Promise.all([requireOwner(), requireAdmin()]);

  // Fetch media separately to avoid relationship ambiguity
  const { data: mediaRows } = await db
    .from('media')
    .select('id, kind, uri, sort_order, object_id')
    .eq('object_id', data.id);
  const media = (mediaRows ?? []).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const img = media[0]?.uri as string | undefined;
  const classifications = (data.object_classifications ?? [])
    .map((oc: any) => oc.classification)
    .filter(Boolean);

  const baseId = `https://collection.ito.com/id/${token}`;
  const jsonld = buildLinkedArtJSONLD(data, media, classifications, baseId);

  return (
    <main className="max-w-4xl mx-auto p-6">
      <header className="mb-4">
        <h1 className="text-xl font-semibold">{data.title}</h1>
        {data.title_ja ? <p className="text-sm" lang="ja">{data.title_ja}</p> : null}
        {isAdmin || isOwner ? (
          <p className="text-xs mt-1"><a className="underline" href={`/admin/${token}`}>Edit</a></p>
        ) : null}
      </header>

      {img ? (
        <div className="relative w-full" style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', background: '#f8f8f8', borderRadius: 6, overflow: 'hidden', border: '1px solid #eee' }}>
          <a href={img} target="_blank" rel="noreferrer">
            <Image src={img} alt={data.title} fill sizes="(max-width: 768px) 100vw, 768px" style={{ objectFit: 'cover' }} />
          </a>
        </div>
      ) : null}

      <div className="grid mt-6" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <section>
          <h2 className="text-lg font-semibold mb-2">Details</h2>
          <dl className="space-y-2">
            {data.local_number ? (
              <div>
                <dt className="text-sm text-gray-600">Number</dt>
                <dd>{data.local_number}</dd>
              </div>
            ) : null}
            {(data.craftsman || data.craftsman_ja) ? (
              <div>
                <dt className="text-sm text-gray-600">Craftsman</dt>
                <dd>
                  {data.craftsman || ''} {data.craftsman_ja ? <span lang="ja">/ {data.craftsman_ja}</span> : null}
                </dd>
              </div>
            ) : null}
            {data.event_date ? (
              <div>
                <dt className="text-sm text-gray-600">Date</dt>
                <dd>{String(data.event_date)}</dd>
              </div>
            ) : null}
            {data.url ? (
              <div>
                <dt className="text-sm text-gray-600">URL</dt>
                <dd><a className="underline" href={data.url} target="_blank" rel="noreferrer">{data.url}</a></dd>
              </div>
            ) : null}
            {Array.isArray(data.tags) && data.tags.length ? (
              <div>
                <dt className="text-sm text-gray-600">Tags</dt>
                <dd>{data.tags.join(', ')}</dd>
              </div>
            ) : null}
            {(isAdmin || isOwner) && (data.store || data.store_ja) ? (
              <div>
                <dt className="text-sm text-gray-600">Store</dt>
                <dd>
                  {data.store || ''} {data.store_ja ? <span lang="ja">/ {data.store_ja}</span> : null}
                </dd>
              </div>
            ) : null}
            {(isAdmin || isOwner) && (data.location || data.location_ja) ? (
              <div>
                <dt className="text-sm text-gray-600">Location</dt>
                <dd>
                  {data.location || ''} {data.location_ja ? <span lang="ja">/ {data.location_ja}</span> : null}
                </dd>
              </div>
            ) : null}
            {isOwner && (data.price != null) ? (
              <div>
                <dt className="text-sm text-gray-600">Price</dt>
                <dd><RevealPrice price={Number(data.price)} /></dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Description</h2>
          {data.summary ? <p className="mb-2">{data.summary}</p> : null}
          {data.summary_ja ? <p className="mb-2" lang="ja">{data.summary_ja}</p> : null}
          {(isAdmin || isOwner) && (data.notes || data.notes_ja) ? (
            <div className="mt-2">
              <h3 className="text-md font-semibold mb-1">Notes</h3>
              {data.notes ? <p className="mb-1">{data.notes}</p> : null}
              {data.notes_ja ? <p className="mb-1" lang="ja">{data.notes_ja}</p> : null}
            </div>
          ) : null}
        </section>
      </div>

      <section className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Classifications</h2>
        <ul className="list-disc pl-6 space-y-1">
          {classifications.map((c: any, i: number) => (
            <li key={i}>
              <strong>{c?.label || c?.uri}</strong>
              {c?.label_ja ? <span lang="ja"> / {c.label_ja}</span> : null}
              {c?.scheme ? <span className="text-xs text-gray-600"> · {c.scheme}</span> : null}
            </li>
          ))}
          {classifications.length === 0 ? <li className="text-sm text-gray-600">None</li> : null}
        </ul>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
    </main>
  );
}
