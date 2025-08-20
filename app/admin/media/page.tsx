import { redirect } from 'next/navigation';
import Image from 'next/image';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import SubmitButton from '@/app/components/SubmitButton';
import { parseSupabasePublicUrl } from '@/lib/storage';

async function saveMedia(formData: FormData) {
  'use server';
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const id = String(formData.get('id') || '');
  const copyright_owner = String(formData.get('copyright_owner') || '').trim() || null;
  const rights_note = String(formData.get('rights_note') || '').trim() || null;
  const license_id_raw = String(formData.get('license_id') || '').trim();
  if (!id) return;
  const db = supabaseAdmin();
  const license_id = license_id_raw || null;

  const updatePayload: any = { copyright_owner, rights_note, license_id: license_id || null };
  if (license_id) {
    // If a structured license is selected, clear any previous free-text license value
    updatePayload.license = null;
  }

  const { error } = await db
    .from('media')
    .update(updatePayload)
    .eq('id', id);
  if (error) {
    console.error('[admin/media] update error', error.message || error);
  }
  revalidatePath('/admin/media');
}

async function deleteMedia(formData: FormData) {
  'use server';
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
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

export default async function MediaAdminPage() {
  const ok = await requireAdmin();
  if (!ok) redirect('/login');
  const db = supabaseAdmin();
  // Fetch media rows first
  let query = db
    .from('media')
    .select('id, uri, kind, rights_note, copyright_owner, license_id, license, object_id, local_number, token', { count: 'exact' })
    .order('id', { ascending: false })
    .limit(200);
  const { data: mediaRows, error: eMedia, count } = await query;
  if (eMedia) console.error('[admin/media] media query error', eMedia.message || eMedia);
  const rows = Array.isArray(mediaRows) ? mediaRows : [];
  const objectIds = Array.from(new Set(rows.map((r: any) => r.object_id).filter(Boolean)));
  const objectsById: Record<string, any> = {};
  if (objectIds.length) {
    const { data: objs, error: eObj } = await db.from('objects').select('id, token, title, local_number').in('id', objectIds);
    if (eObj) console.error('[admin/media] objects query error', eObj.message || eObj);
    for (const o of objs || []) objectsById[(o as any).id] = o;
  }

  // Load Creative Commons licenses for dropdown
  const { data: ccLicenses, error: eLic } = await db
    .from('licenses')
    .select('id, code, name')
    .ilike('code', 'CC%')
    .order('code', { ascending: true });
  if (eLic) console.error('[admin/media] licenses query error', eLic.message || eLic);

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Media</h1>
      {!rows.length ? (
        <div className="card" style={{ background: '#fff7ed', borderColor: '#fed7aa', marginBottom: 12 }}>
          {typeof count === 'number' ? `No media found (count=${count}).` : 'No media to display.'}
        </div>
      ) : null}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {rows.map((m: any) => (
          <div key={m.id} className="card">
            <div style={{ position: 'relative', width: '100%', paddingTop: '66%', background: '#f5f5f5', borderRadius: 4, overflow: 'hidden' }}>
              {m.uri ? (
                <a href={`/media/${m.id}`}>
                  <Image src={m.uri} alt={objectsById[m.object_id as string]?.title || 'Image'} fill sizes="240px" style={{ objectFit: 'cover' }} />
                </a>
              ) : null}
            </div>
            <div style={{ marginTop: 8 }}>
              <p className="text-sm">
                <a className="underline" href={`/media/${m.token || m.id}`}>{m.local_number || (m.token ? `token:${m.token}` : m.id)}</a>
              </p>
              <form action={saveMedia} style={{ marginTop: 8 }}>
                <input type="hidden" name="id" value={m.id} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                  <div>
                    <label className="label" htmlFor={`copyright_owner_${m.id}`}>Copyright owner</label>
                    <input id={`copyright_owner_${m.id}`} name="copyright_owner" className="input" placeholder="Copyright owner" defaultValue={m.copyright_owner || ''} style={{ fontSize: 14 }} />
                  </div>
                  <div>
                    <label className="label" htmlFor={`rights_note_${m.id}`}>Rights note</label>
                    <input id={`rights_note_${m.id}`} name="rights_note" className="input" placeholder="Rights note" defaultValue={m.rights_note || ''} style={{ fontSize: 14 }} />
                  </div>
                  <div>
                    <label className="label" htmlFor={`license_id_${m.id}`}>License</label>
                    <select id={`license_id_${m.id}`} name="license_id" className="input" defaultValue={m.license_id || ''} style={{ fontSize: 14 }}>
                      <option value="">(none)</option>
                      {(ccLicenses || []).map((lic: any) => (
                        <option key={lic.id} value={lic.id}>{lic.code} — {lic.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <SubmitButton small label="Save" pendingLabel="Saving..." />
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
