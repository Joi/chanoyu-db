import { notFound } from 'next/navigation';
import Image from 'next/image';
import { supabaseAdmin } from '@/lib/supabase/server';
// import { makeSupabaseThumbUrl } from '@/lib/storage';

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
  const obj: any = (data as any).object;
  const licArr: any = (data as any).license;
  const lic: any = Array.isArray(licArr) ? licArr[0] : licArr;

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-2">Media</h1>
      {data.uri ? (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', background: '#f5f5f5', borderRadius: 6, overflow: 'hidden', border: '1px solid #eee' }}>
          <a href={data.uri} target="_blank" rel="noreferrer">
            <Image src={data.uri} alt={(data as any).object?.title || 'Image'} fill sizes="(max-width: 768px) 100vw, 640px" style={{ objectFit: 'contain', background: '#fff' }} />
          </a>
        </div>
      ) : null}
      <div className="card" style={{ marginTop: 12 }}>
        <p><strong>Object</strong>: {obj?.title} {obj?.title_ja ? <span lang="ja">/ {obj.title_ja}</span> : null} — {obj ? <a className="underline" href={`/id/${obj.token}`}>/id/{obj.token}</a> : '—'}</p>
        <p><strong>Copyright owner</strong>: {data.copyright_owner || '—'}</p>
        <p><strong>Rights note</strong>: {data.rights_note || '—'}</p>
        <p><strong>License</strong>: {lic ? <a className="underline" href={lic.uri} target="_blank" rel="noreferrer">{lic.code} — {lic.name}</a> : '—'}</p>
        <p><strong>Storage</strong>: {data.bucket}/{data.storage_path || '—'}</p>
      </div>
    </main>
  );
}
