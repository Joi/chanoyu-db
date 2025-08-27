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
      id, token, local_number, title, title_ja, summary, summary_ja, visibility,
      media ( id, kind, uri, sort_order ),
      object_classifications (
        role,
        classification:classifications ( label, label_ja, scheme, uri )
      )
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
  const classifications = (data.object_classifications ?? []).map((oc: any) => oc.classification).filter(Boolean);
  const jsonld = buildLinkedArtJSONLD(data, media, classifications, baseId);
  const headers = new Headers({ 'content-type': 'application/ld+json' });
  headers.set('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
  headers.set('CDN-Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
  return NextResponse.json(jsonld, { headers });
}
