import Image from 'next/image';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { buildLinkedArtJSONLD } from '@/lib/jsonld';

type Props = { params: { token: string } };

export default async function ObjectPage({ params }: Props) {
  const { token } = params;

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
    .eq('token', token)
    .single();

  if (error || !data || data.visibility !== 'public') return notFound();

  const media = (data.media ?? []).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const img = media[0]?.uri as string | undefined;
  const classifications = (data.object_classifications ?? [])
    .map((oc: any) => oc.classification)
    .filter(Boolean);

  const baseId = `https://collection.ito.com/id/${token}`;
  const jsonld = buildLinkedArtJSONLD(data, media, classifications, baseId);

  return (
    <main className="prose max-w-3xl mx-auto p-6">
      <h1>{data.title}</h1>
      {data.title_ja ? <h2 lang="ja">{data.title_ja}</h2> : null}

      {img ? (
        <div style={{ width: 640, height: 480, position: 'relative' }}>
          <Image src={img} alt={data.title} fill sizes="(max-width: 640px) 100vw, 640px" />
        </div>
      ) : null}

      {data.local_number ? (
        <p>
          <strong>No.</strong> {data.local_number}
        </p>
      ) : null}

      {data.summary ? <p>{data.summary}</p> : null}
      {data.summary_ja ? <p lang="ja">{data.summary_ja}</p> : null}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
    </main>
  );
}
