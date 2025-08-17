import { notFound } from 'next/navigation';
import Image from 'next/image';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { parseSupabasePublicUrl } from '@/lib/storage';

async function saveMedia(formData: FormData) {
  'use server';
  const ok = await requireAdmin();
  if (!ok) return notFound();
  const id = String(formData.get('id') || '');
  const copyright_owner = String(formData.get('copyright_owner') || '').trim() || null;
  const rights_note = String(formData.get('rights_note') || '').trim() || null;
  const license_id = String(formData.get('license_id') || '').trim() || null;
  if (!id) return;
  const db = supabaseAdmin();
  await db.from('media').update({ copyright_owner, rights_note, license_id }).eq('id', id);
  revalidatePath('/admin/media');
}

async function deleteMedia(formData: FormData) {
  'use server';
  const ok = await requireAdmin();
  if (!ok) return notFound();
  const id = String(formData.get('id') || '');
  if (!id) return;
  const db = supabaseAdmin();
  const { data } = await db.from('media').select('id, uri').eq('id', id).single();
  if (data) {
    const parsed = parseSupabasePublicUrl(data.uri);
    if (parsed) {
      try {
        // @ts-ignore
        await (db as any).storage.from(parsed.bucket).remove([parsed.path]);
      } catch {}
    }
    await db.from('media').delete().eq('id', id);
  }
  revalidatePath('/admin/media');
}

export default async function MediaAdminPage({ searchParams }: { searchParams: { q?: string } }) {
  const ok = await requireAdmin();
  if (!ok) return notFound();
  const q = (searchParams.q || '').trim();
  const db = supabaseAdmin();
  // Fetch media rows first
  let query = db
    .from('media')
    .select('id, uri, kind, rights_note, copyright_owner, license_id, object_id', { count: 'exact' })
    .order('id', { ascending: false })
    .limit(200);
  if (q) query = query.ilike('rights_note', `%${q}%`);
  const { data: mediaRows, error: eMedia, count } = await query;
  if (eMedia) console.error('[admin/media] media query error', eMedia.message || eMedia);
  const rows = Array.isArray(mediaRows) ? mediaRows : [];
  const objectIds = Array.from(new Set(rows.map((r: any) => r.object_id).filter(Boolean)));
  const objectsById: Record<string, any> = {};
  if (objectIds.length) {
    const { data: objs, error: eObj } = await db.from('objects').select('id, token, title').in('id', objectIds);
    if (eObj) console.error('[admin/media] objects query error', eObj.message || eObj);
    for (const o of objs || []) objectsById[(o as any).id] = o;
  }

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Media</h1>
      {!rows.length ? (
        <div className="card" style={{ background: '#fff7ed', borderColor: '#fed7aa', marginBottom: 12 }}>
          {typeof count === 'number' ? `No media found (count=${count}).` : 'No media to display.'}
        </div>
      ) : null}
      <form className="mb-4">
        <input name="q" className="input" placeholder="Search rights/owner" defaultValue={q} />
      </form>
      <div className="grid" style={{ gap: 12 }}>
        {rows.map((m: any) => (
          <div key={m.id} className="card" style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12 }}>
            <div style={{ position: 'relative', width: 120, height: 90, background: '#f5f5f5', borderRadius: 4, overflow: 'hidden' }}>
              {m.uri ? (
                <a href={m.uri} target="_blank" rel="noreferrer">
                  <Image src={m.uri} alt={m.object?.title || 'Image'} fill sizes="120px" style={{ objectFit: 'cover' }} />
                </a>
              ) : null}
            </div>
            <div>
              <p className="text-sm">
                {objectsById[m.object_id as string] ? (
                  <a className="underline" href={`/admin/${objectsById[m.object_id as string].token}`}>{objectsById[m.object_id as string].title}</a>
                ) : '—'}
                {' '}· <a className="underline" href={`/media/${m.id}`}>/media/{m.id}</a>
              </p>
              <form action={saveMedia} className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                <input type="hidden" name="id" value={m.id} />
                <input name="copyright_owner" className="input" placeholder="Copyright owner" defaultValue={m.copyright_owner || ''} />
                <input name="rights_note" className="input" placeholder="Rights note" defaultValue={m.rights_note || ''} />
                <input name="license_id" className="input" placeholder="License ID (optional)" defaultValue={m.license?.id || ''} />
                <div>
                  <button className="button" type="submit">Save</button>
                </div>
              </form>
              <form action={deleteMedia} className="mt-2">
                <input type="hidden" name="id" value={m.id} />
                <button className="text-red-600 text-sm" type="submit">Delete</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
