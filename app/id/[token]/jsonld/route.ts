import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { buildLinkedArtJSONLD } from '@/lib/jsonld';

export const revalidate = 60 * 60 * 24 * 365;

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from('objects')
    .select(
      `
      id, token, local_number, title, title_ja, visibility,
      media ( id, kind, uri, sort_order ),
      primary_local_class_id
    `
    )
    .eq('token', params.token)
    .single();

  if (error || !data || data.visibility !== 'public') {
    // For now, return 404 for non-objects; later we could emit JSON-LD for tea rooms / chakai
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const baseId = `https://collection.ito.com/id/${params.token}`;
  const media = (data.media ?? []);
  // Resolve classifications via the object's primary Local Class preferred external link
  let classifications: any[] = [];
  const plcId = (data as any).primary_local_class_id as string | null;
  if (plcId) {
    const [{ data: lc }, { data: extLinks }] = await Promise.all([
      db
        .from('local_classes')
        .select('id, preferred_classification_id')
        .eq('id', plcId)
        .maybeSingle(),
      db
        .from('local_class_links')
        .select('classification:classifications(id, scheme, uri, label, label_ja)')
        .eq('local_class_id', plcId),
    ]);
    const preferredId = lc?.preferred_classification_id ? String(lc.preferred_classification_id) : '';
    const preferred = (extLinks || []).map((r: any) => r.classification).find((c: any) => String(c.id) === preferredId);
    if (preferred) classifications = [preferred];
  }
  const jsonld = buildLinkedArtJSONLD(data, media, classifications, baseId);
  const headers = new Headers({ 'content-type': 'application/ld+json' });
  headers.set('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
  headers.set('CDN-Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
  return NextResponse.json(jsonld, { headers });
}
