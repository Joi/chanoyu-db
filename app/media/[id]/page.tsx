import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin, requireOwner } from '@/lib/auth';
// import { makeSupabaseThumbUrl } from '@/lib/storage';

async function updateMediaAction(formData: FormData) {
  'use server';
  const id = String(formData.get('media_id') || '');
  const copyright_owner = String(formData.get('copyright_owner') || '').trim() || null;
  const rights_note = String(formData.get('rights_note') || '').trim() || null;
  const license_id = String(formData.get('license_id') || '').trim() || null;
  if (!id) return;
  // Require at least admin
  const okAdmin = await requireAdmin();
  const okOwner = await requireOwner();
  if (!okAdmin && !okOwner) return;
  const db = supabaseAdmin();
  await db.from('media').update({ copyright_owner, rights_note, license_id }).eq('id', id);
  revalidatePath(`/media/${id}`);
  redirect(`/media/${id}?saved=media`);
}

export default async function MediaPage({ params, searchParams }: { params: { id: string }, searchParams?: { [key: string]: string | string[] | undefined } }) {
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
  // License info and list for editing
  const [{ data: licOne }, { data: licList }, isOwner, isAdmin] = await Promise.all([
    mediaRow.license_id ? db.from('licenses').select('id, code, name, uri').eq('id', mediaRow.license_id).maybeSingle() : Promise.resolve({ data: null }),
    db.from('licenses').select('id, code, name, uri').order('code'),
    requireOwner(),
    requireAdmin(),
  ] as any);
  const canEdit = Boolean(isOwner || isAdmin);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-2">Media</h1>
      {typeof searchParams?.saved === 'string' ? (
        <div className="card" style={{ background: '#f0fff4', borderColor: '#bbf7d0', marginBottom: 12 }}>Saved media</div>
      ) : null}
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
        <p><strong>License</strong>: {licOne ? <a className="underline" href={licOne.uri} target="_blank" rel="noreferrer">{licOne.code} — {licOne.name}</a> : '—'}</p>
        <p><strong>Storage</strong>: {mediaRow.bucket}/{(mediaRow.storage_path || '').replace(/^media\//,'') || '—'}</p>
      </div>

      {canEdit ? (
        <form action={updateMediaAction} className="card space-y-2" style={{ marginTop: 12 }}>
          <input type="hidden" name="media_id" value={mediaRow.id} />
          <label className="label">Copyright owner</label>
          <input name="copyright_owner" className="input" defaultValue={mediaRow.copyright_owner || ''} />
          <label className="label">License</label>
          <select name="license_id" className="input" defaultValue={mediaRow.license_id || ''}>
            <option value="">Select license</option>
            {(licList || []).map((lic: any) => (
              <option key={lic.id} value={lic.id}>{lic.code} — {lic.name}</option>
            ))}
          </select>
          <label className="label">Rights/metadata note</label>
          <textarea name="rights_note" className="textarea" defaultValue={mediaRow.rights_note || ''} />
          <div><button className="button" type="submit">Save</button></div>
        </form>
      ) : null}
    </main>
  );
}
