import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { buildLinkedArtJSONLD } from '@/lib/jsonld';

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const db = supabaseAdmin();
  const { data } = await db
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

  if (!data || data.visibility !== 'public') return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const baseId = `https://collection.ito.com/id/${params.token}`;
  const media = (data.media ?? []);
  const classifications = (data.object_classifications ?? []).map((oc: any) => oc.classification).filter(Boolean);
  const jsonld = buildLinkedArtJSONLD(data, media, classifications, baseId);
  return NextResponse.json(jsonld, { headers: { 'content-type': 'application/ld+json' } });
}
