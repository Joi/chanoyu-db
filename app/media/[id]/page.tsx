import { notFound } from 'next/navigation';
import Image from 'next/image';
import { supabaseAdmin } from '@/lib/supabase/server';

export default async function MediaPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const db = supabaseAdmin();
  const { data } = await db
    .from('media')
    .select(
      `id, uri, kind, copyright_owner, rights_note, bucket, storage_path,
       license:licenses(id, code, name, uri),
       object:objects(id, token, title, title_ja)`
    )
    .eq('id', id)
    .single();

  if (!data) return notFound();

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-2">Media</h1>
      {data.uri ? (
        <div style={{ position: 'relative', width: '100%', paddingTop: '66%', background: '#f5f5f5' }}>
          <Image src={data.uri} alt={(data as any).object?.title || 'Image'} fill sizes="(max-width: 768px) 100vw, 640px" />
        </div>
      ) : null}
      <div className="card" style={{ marginTop: 12 }}>
        <p><strong>Object</strong>: {data.object?.title} {data.object?.title_ja ? <span lang="ja">/ {data.object.title_ja}</span> : null} — {data.object ? <a className="underline" href={`/id/${data.object.token}`}>/id/{data.object.token}</a> : '—'}</p>
        <p><strong>Copyright owner</strong>: {data.copyright_owner || '—'}</p>
        <p><strong>Rights note</strong>: {data.rights_note || '—'}</p>
        <p><strong>License</strong>: {data.license ? <a className="underline" href={data.license.uri} target="_blank" rel="noreferrer">{data.license.code} — {data.license.name}</a> : '—'}</p>
        <p><strong>Storage</strong>: {data.bucket}/{data.storage_path || '—'}</p>
      </div>
    </main>
  );
}
