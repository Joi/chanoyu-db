import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { buildLinkedArtJSONLD } from '@/lib/jsonld';
import RevealPrice from '@/app/components/RevealPrice';
import Container from '@/app/components/Container'
import Title from '@/app/components/Title'
import Separator from '@/app/components/Separator'
// import { makeSupabaseThumbUrl } from '@/lib/storage';
import { requireAdmin, requireOwner } from '@/lib/auth';

type Props = { params: { token: string } };

export const revalidate = 60 * 60 * 6; // 6 hours

export default async function ObjectPage({ params }: Props) {
  const { token } = params;

  const db = supabaseAdmin();
  
  // Check auth first
  const [isOwner, isAdmin] = await Promise.all([requireOwner(), requireAdmin()]);
  
  // Fetch object core fields first (avoid ambiguous media join)
  const { data, error } = await db
    .from('objects')
    .select(
      `id, token, local_number, title, title_ja, visibility,
       price, store, store_ja, location, location_ja, tags, craftsman, craftsman_ja, event_date, notes, notes_ja, url,
       primary_local_class_id`
    )
    .eq('token', token)
    .single();

  // Debug: Log auth and data state (remove this later)
  console.log('DEBUG auth:', { isOwner, isAdmin, visibility: data?.visibility, error: error?.message, hasData: !!data });
  
  // If not an object token, try locations (tea rooms) or chakai and redirect
  if (error || !data || (data.visibility !== 'public' && !isOwner && !isAdmin)) {
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

  // Fetch media separately to avoid relationship ambiguity
  const { data: mediaRows } = await db
    .from('media')
    .select('id, kind, uri, sort_order, object_id')
    .eq('object_id', data.id);
  const media = (mediaRows ?? []).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const img = media[0]?.uri as string | undefined;
  // Resolve Local Class info and external links
  let localClassTitle: string = '';
  let localClassBreadcrumb: string[] = [];
  let localClassExternal: any[] = [];
  if ((data as any).primary_local_class_id) {
    const plcId = (data as any).primary_local_class_id as string;
    const [{ data: lc }, { data: chain }] = await Promise.all([
      db.from('local_classes').select('id, token, local_number, label_en, label_ja, preferred_classification_id').eq('id', plcId).maybeSingle(),
      db.from('local_class_hierarchy').select('ancestor_id, descendant_id, depth').eq('descendant_id', plcId),
    ]);
    const ancestorIds = Array.from(new Set(((chain || []) as any[]).map((r: any) => String(r.ancestor_id)).filter((aid) => aid !== plcId)));
    if (ancestorIds.length) {
      const { data: rows } = await db.from('local_classes').select('id, local_number, label_en, label_ja').in('id', ancestorIds);
      const byId: Record<string, any> = Object.create(null);
      for (const a of rows || []) byId[String((a as any).id)] = a;
      localClassBreadcrumb = ((chain || []) as any[])
        .filter((r: any) => String(r.ancestor_id) !== plcId)
        .sort((a: any, b: any) => a.depth - b.depth)
        .map((r: any) => byId[String(r.ancestor_id)])
        .filter(Boolean)
        .map((a: any) => String(a.label_ja || a.label_en || a.local_number || a.id));
    }
    const title = lc ? String(lc.label_ja || lc.label_en || lc.local_number || lc.id) : '';
    localClassTitle = title;
    const { data: extRows } = await db
      .from('local_class_links')
      .select('classification:classifications(id, scheme, uri, label, label_ja)')
      .eq('local_class_id', plcId);
    localClassExternal = (extRows || []).map((r: any) => r.classification).filter(Boolean);
  }

  const baseId = `https://collection.ito.com/id/${token}`;
  // Build classifications for JSON-LD from preferred external link if available
  let jsonldClassifications: any[] = [];
  if ((data as any).primary_local_class_id) {
    const plcId = (data as any).primary_local_class_id as string;
    const [{ data: lc }, { data: extRows }] = await Promise.all([
      db.from('local_classes').select('id, preferred_classification_id').eq('id', plcId).maybeSingle(),
      db.from('local_class_links').select('classification:classifications(id, scheme, uri, label, label_ja)').eq('local_class_id', plcId),
    ]);
    const preferredId = lc?.preferred_classification_id ? String(lc.preferred_classification_id) : '';
    const preferred = (extRows || []).map((r: any) => r.classification).find((c: any) => String(c.id) === preferredId);
    if (preferred) jsonldClassifications = [preferred];
  }
  const jsonld = buildLinkedArtJSONLD(data, media, jsonldClassifications, baseId);

  return (
    <main>
      <Container>
        <header className="py-6">
          <Title level={1}>{data.title || data.title_ja || data.local_number || data.token}</Title>
          {data.title_ja && data.title ? (
            <p className="text-sm text-muted-foreground" lang="ja">{data.title_ja}</p>
          ) : null}
          {(isAdmin || isOwner) ? (
            <p className="text-xs mt-1"><a className="underline" href={`/admin/${token}`}>Edit</a></p>
          ) : null}
          <div className="mt-4 border border-border rounded-lg p-3 bg-card">
            <h2 className="text-sm font-semibold mb-1">Classification</h2>
            <div className="grid gap-2">
              {localClassTitle ? (
                <div className="text-sm">{localClassTitle}</div>
              ) : (
                <div className="text-xs text-muted-foreground">No local class selected</div>
              )}
              {localClassBreadcrumb.length ? (
                <div className="text-xs text-muted-foreground">{localClassBreadcrumb.join(' / ')}</div>
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
          </div>
        </header>

        {img ? (
          <div className="relative w-full aspect-[4/3] bg-background rounded-lg overflow-hidden border border-border">
            <a href={img} target="_blank" rel="noreferrer">
              <Image src={img} alt={data.title || ''} fill sizes="(max-width: 1024px) 100vw, 1024px" className="object-cover" />
            </a>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <section>
            <h2 className="text-[1.5rem] leading-snug mb-2 font-semibold">Details</h2>
            <Separator className="mb-3" />
            <dl className="space-y-3">
              {data.local_number ? (
                <div>
                  <dt className="text-sm text-muted-foreground">Number</dt>
                  <dd>{data.local_number}</dd>
                </div>
              ) : null}
              {(data.craftsman || data.craftsman_ja) ? (
                <div>
                  <dt className="text-sm text-muted-foreground">Craftsman</dt>
                  <dd>
                    {data.craftsman || ''} {data.craftsman_ja ? <span lang="ja">/ {data.craftsman_ja}</span> : null}
                  </dd>
                </div>
              ) : null}
              {data.event_date ? (
                <div>
                  <dt className="text-sm text-muted-foreground">Date</dt>
                  <dd>{String(data.event_date)}</dd>
                </div>
              ) : null}
              {data.url ? (
                <div>
                  <dt className="text-sm text-muted-foreground">URL</dt>
                  <dd><a className="underline" href={data.url} target="_blank" rel="noreferrer">{data.url}</a></dd>
                </div>
              ) : null}
              {Array.isArray(data.tags) && data.tags.length ? (
                <div>
                  <dt className="text-sm text-muted-foreground">Tags</dt>
                  <dd>{data.tags.join(', ')}</dd>
                </div>
              ) : null}
              {(isAdmin || isOwner) && (data.store || data.store_ja) ? (
                <div>
                  <dt className="text-sm text-muted-foreground">Store</dt>
                  <dd>
                    {data.store || ''} {data.store_ja ? <span lang="ja">/ {data.store_ja}</span> : null}
                  </dd>
                </div>
              ) : null}
              {(isAdmin || isOwner) && (data.location || data.location_ja) ? (
                <div>
                  <dt className="text-sm text-muted-foreground">Location</dt>
                  <dd>
                    {data.location || ''} {data.location_ja ? <span lang="ja">/ {data.location_ja}</span> : null}
                  </dd>
                </div>
              ) : null}
              {isOwner && (data.price != null) ? (
                <div>
                  <dt className="text-sm text-muted-foreground">Price</dt>
                  <dd><RevealPrice price={Number(data.price)} /></dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section>
            <h2 className="text-[1.5rem] leading-snug mb-2 font-semibold">Description</h2>
            <Separator className="mb-3" />
            {(data.notes || data.notes_ja) ? (
              <div className="prose">
                {data.notes ? <p className="mb-1">{data.notes}</p> : null}
                {data.notes_ja ? <p className="mb-1" lang="ja">{data.notes_ja}</p> : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No description</p>
            )}
          </section>
        </div>

        {/* Removed direct per-object classifications list in favor of Local Class display above */}

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      </Container>
    </main>
  );
}
