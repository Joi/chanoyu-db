import { notFound } from 'next/navigation';
import Image from 'next/image';
import { supabaseAdmin } from '@/lib/supabase/server';
// import { makeSupabaseThumbUrl } from '@/lib/storage';

export default async function MediaPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const db = supabaseAdmin();
  // Fetch media row without ambiguous embeds
  const { data: mediaRow, error } = await db
    .from('media')
    .select('id, uri, kind, copyright_owner, rights_note, bucket, storage_path, license_id, object_id')
    .eq('id', id)
    .single();
  if (error || !mediaRow) return notFound();

  // Resolve linked object (direct FK first, then via many-to-many)
  let obj: any = null;
  if (mediaRow.object_id) {
    const { data: o } = await db.from('objects').select('id, token, title, title_ja').eq('id', mediaRow.object_id).maybeSingle();
    obj = o || null;
  }
  if (!obj) {
    const { data: link } = await db.from('object_media_links').select('object_id').eq('media_id', mediaRow.id).limit(1).maybeSingle();
    if (link?.object_id) {
      const { data: o2 } = await db.from('objects').select('id, token, title, title_ja').eq('id', link.object_id).maybeSingle();
      obj = o2 || null;
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-2">Media</h1>
      {mediaRow.uri ? (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', background: '#f5f5f5', borderRadius: 6, overflow: 'hidden', border: '1px solid #eee' }}>
          <a href={mediaRow.uri} target="_blank" rel="noreferrer">
            <Image src={mediaRow.uri} alt={obj?.title || 'Image'} fill sizes="(max-width: 768px) 100vw, 640px" style={{ objectFit: 'contain', background: '#fff' }} />
          </a>
        </div>
      ) : null}
      <div className="card" style={{ marginTop: 12 }}>
        <p><strong>Object</strong>: {obj?.title} {obj?.title_ja ? <span lang="ja">/ {obj.title_ja}</span> : null} — {obj ? <a className="underline" href={`/id/${obj.token}`}>/id/{obj.token}</a> : '—'}</p>
        <p><strong>Copyright owner</strong>: {mediaRow.copyright_owner || '—'}</p>
        <p><strong>Rights note</strong>: {mediaRow.rights_note || '—'}</p>
        <p><strong>Storage</strong>: {mediaRow.bucket}/{(mediaRow.storage_path || '').replace(/^media\//,'') || '—'}</p>
      </div>
    </main>
  );
}
