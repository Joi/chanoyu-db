import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { buildLinkedArtJSONLD } from '@/lib/jsonld';
import { BASE_URL, APP_OWNER } from '@/lib/branding';

export async function GET(req: NextRequest, { params }: { params: { naan: string; name: string[] } }) {
  const arkName = params.name.join('/');
  const accept = req.headers.get('accept') ?? '';
  const search = req.nextUrl.search; // includes leading '?', or ''

  const db = supabaseAdmin();
  const { data } = await db
    .from('objects')
    .select(
      `
      id, token, local_number, title, title_ja, visibility,
      media ( id, kind, uri, sort_order ),
      object_classifications (
        role,
        classification:classifications ( label, label_ja, scheme, uri )
      )
    `
    )
    .eq('ark_name', arkName)
    .single();

  if (!data || data.visibility !== 'public') return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const baseArk = `${BASE_URL}/ark:/${params.naan}/${arkName}`;
  const media = (data.media ?? []);
  const classifications = (data.object_classifications ?? []).map((oc: any) => oc.classification).filter(Boolean);
  const jsonld = buildLinkedArtJSONLD(
    data,
    media,
    classifications,
    `${BASE_URL}/id/${data.token}`,
    baseArk
  );

  if (search === '??') {
    return NextResponse.json({
      policy: 'Placeholder ARK persistence policy',
      contact: 'mailto:collections@ito.com',
    });
  }

  if (search === '?') {
    return NextResponse.json({ who: APP_OWNER, what: data.title, local_number: data.local_number, id: baseArk });
  }

  if (accept.includes('application/ld+json')) {
    return NextResponse.json(jsonld, { headers: { 'content-type': 'application/ld+json' } });
  }

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${data.title}</title></head>
<body>
  <h1>${data.title}</h1>
  ${data.title_ja ? `<h2 lang="ja">${data.title_ja}</h2>` : ''}
  <p><a href="/id/${data.token}">Canonical record</a></p>
</body></html>`;
  return new NextResponse(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
