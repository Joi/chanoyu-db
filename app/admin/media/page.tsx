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

async function updateVisibility(formData: FormData) {
  'use server';
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const id = String(formData.get('id') || '');
  const visibility = String(formData.get('visibility') || 'public');
  if (!id) return;
  const db = supabaseAdmin();
  const { error } = await db
    .from('media')
    .update({ visibility })
    .eq('id', id);
  if (error) {
    console.error('[admin/media] visibility update error', error.message || error);
  }
  revalidatePath('/admin/media');
}

async function bulkUpdateVisibility(formData: FormData) {
  'use server';
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const visibility = String(formData.get('visibility') || 'public');
  const selectedIds = String(formData.get('selectedIds') || '').split(',').filter(Boolean);
  if (!selectedIds.length) return;
  const db = supabaseAdmin();
  const { error } = await db
    .from('media')
    .update({ visibility })
    .in('id', selectedIds);
  if (error) {
    console.error('[admin/media] bulk visibility update error', error.message || error);
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
    .select('id, uri, kind, rights_note, copyright_owner, license_id, license, object_id, local_number, token, visibility, file_type, original_filename', { count: 'exact' })
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
      <h1 className="text-xl font-semibold mb-4">Media Management</h1>
      
      {/* Bulk Operations Bar */}
      <div className="card mb-4" style={{ background: '#f8fafc' }}>
        <h3 className="text-sm font-medium mb-3">Bulk Operations</h3>
        <div className="flex items-center gap-4">
          <button 
            id="selectAll" 
            className="text-sm text-blue-600" 
            type="button"
          >
            Select All
          </button>
          <div className="flex items-center gap-2">
            <form action={bulkUpdateVisibility} className="flex items-center gap-2">
              <input type="hidden" name="selectedIds" id="selectedIds" />
              <select name="visibility" className="input text-sm" style={{ padding: '4px 8px' }}>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
              <button type="submit" className="btn-secondary text-sm" style={{ padding: '4px 12px' }}>
                Update Selected
              </button>
            </form>
          </div>
          <div className="text-sm text-gray-500">
            <span id="selectedCount">0</span> items selected
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card mb-4" style={{ background: '#f8fafc' }}>
        <h3 className="text-sm font-medium mb-3">Filters</h3>
        <div className="flex items-center gap-4">
          <select id="visibilityFilter" className="input text-sm" style={{ padding: '4px 8px' }}>
            <option value="">All Visibility</option>
            <option value="public">Public Only</option>
            <option value="private">Private Only</option>
          </select>
          <select id="fileTypeFilter" className="input text-sm" style={{ padding: '4px 8px' }}>
            <option value="">All File Types</option>
            <option value="pdf">PDFs Only</option>
            <option value="image">Images Only</option>
            <option value="other">Other Types</option>
          </select>
        </div>
      </div>

      {!rows.length ? (
        <div className="card" style={{ background: '#fff7ed', borderColor: '#fed7aa', marginBottom: 12 }}>
          {typeof count === 'number' ? `No media found (count=${count}).` : 'No media to display.'}
        </div>
      ) : null}
      
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {rows.map((m: any) => {
          const isPDF = m.file_type === 'application/pdf' || (m.uri && m.uri.toLowerCase().endsWith('.pdf'));
          const isImage = m.file_type?.startsWith('image/') || (!isPDF && m.uri);
          return (
          <div key={m.id} className="card media-item" data-visibility={m.visibility} data-file-type={isPDF ? 'pdf' : isImage ? 'image' : 'other'}>
            {/* Selection Checkbox */}
            <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
              <input 
                type="checkbox" 
                className="media-checkbox" 
                data-id={m.id}
              />
            </div>
            
            {/* Media Preview */}
            <div style={{ position: 'relative', width: '100%', paddingTop: '66%', background: '#f5f5f5', borderRadius: 4, overflow: 'hidden' }}>
              {isPDF ? (
                <a href={`/media/${m.id}`}>
                  <div style={{ 
                    position: 'absolute', 
                    inset: 0, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexDirection: 'column',
                    background: '#dc2626',
                    color: 'white'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>PDF</div>
                    {m.original_filename && (
                      <div style={{ fontSize: '0.625rem', textAlign: 'center', marginTop: '0.25rem', padding: '0 0.5rem' }}>
                        {m.original_filename.length > 20 ? m.original_filename.substring(0, 20) + '...' : m.original_filename}
                      </div>
                    )}
                  </div>
                </a>
              ) : m.uri && isImage ? (
                <a href={`/media/${m.id}`}>
                  <Image src={m.uri} alt={objectsById[m.object_id as string]?.title || 'Image'} fill sizes="260px" style={{ objectFit: 'cover' }} />
                </a>
              ) : (
                <div style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'column',
                  background: '#6b7280',
                  color: 'white'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📁</div>
                  <div style={{ fontSize: '0.75rem' }}>Other File</div>
                </div>
              )}
              
              {/* Visibility Badge */}
              <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
                <span style={{ 
                  background: m.visibility === 'private' ? '#dc2626' : '#059669',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '0.625rem',
                  fontWeight: 'bold'
                }}>
                  {m.visibility === 'private' ? '🔒 PRIVATE' : '🌐 PUBLIC'}
                </span>
              </div>
            </div>
            
            <div style={{ marginTop: 8 }}>
              <p className="text-sm">
                <a className="underline" href={`/media/${m.token || m.id}`}>{m.local_number || (m.token ? `token:${m.token}` : m.id)}</a>
              </p>
              
              {/* Visibility Toggle */}
              <form action={updateVisibility} style={{ marginTop: 8, marginBottom: 8 }}>
                <input type="hidden" name="id" value={m.id} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label className="text-xs text-gray-600">Visibility:</label>
                  <select name="visibility" className="input text-xs" defaultValue={m.visibility} style={{ fontSize: 12, padding: '2px 4px' }}>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                  <button type="submit" className="text-xs text-blue-600" style={{ padding: '2px 6px' }}>Update</button>
                </div>
              </form>
              <form action={saveMedia} style={{ marginTop: 8 }}>
                <input type="hidden" name="id" value={m.id} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label className="label" htmlFor={`copyright_owner_${m.id}`} style={{ display: 'block', marginBottom: '0.25rem' }}>Copyright owner</label>
                    <input id={`copyright_owner_${m.id}`} name="copyright_owner" className="input" placeholder="Copyright owner" defaultValue={m.copyright_owner || ''} style={{ fontSize: 14 }} />
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label className="label" htmlFor={`rights_note_${m.id}`} style={{ display: 'block', marginBottom: '0.25rem' }}>Rights note</label>
                    <input id={`rights_note_${m.id}`} name="rights_note" className="input" placeholder="Rights note" defaultValue={m.rights_note || ''} style={{ fontSize: 14 }} />
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label className="label" htmlFor={`license_id_${m.id}`} style={{ display: 'block', marginBottom: '0.25rem' }}>License</label>
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
        )})}
      </div>

      {/* JavaScript for interactive functionality */}
      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            function updateSelectedCount() {
              const checkboxes = document.querySelectorAll('.media-checkbox:checked');
              const count = checkboxes.length;
              document.getElementById('selectedCount').textContent = count;
              const selectedIds = Array.from(checkboxes).map(cb => cb.getAttribute('data-id'));
              document.getElementById('selectedIds').value = selectedIds.join(',');
            }
            
            function toggleSelectAll() {
              const checkboxes = document.querySelectorAll('.media-checkbox');
              const allChecked = Array.from(checkboxes).every(cb => cb.checked);
              checkboxes.forEach(cb => cb.checked = !allChecked);
              updateSelectedCount();
            }
            
            function filterMedia() {
              const visibilityFilter = document.getElementById('visibilityFilter').value;
              const fileTypeFilter = document.getElementById('fileTypeFilter').value;
              const mediaItems = document.querySelectorAll('.media-item');
              
              mediaItems.forEach(item => {
                let show = true;
                
                if (visibilityFilter && item.getAttribute('data-visibility') !== visibilityFilter) {
                  show = false;
                }
                
                if (fileTypeFilter && item.getAttribute('data-file-type') !== fileTypeFilter) {
                  show = false;
                }
                
                item.style.display = show ? 'block' : 'none';
              });
            }
            
            // Attach event listeners
            document.getElementById('selectAll').addEventListener('click', toggleSelectAll);
            document.getElementById('visibilityFilter').addEventListener('change', filterMedia);
            document.getElementById('fileTypeFilter').addEventListener('change', filterMedia);
            document.querySelectorAll('.media-checkbox').forEach(cb => {
              cb.addEventListener('change', updateSelectedCount);
            });
          });
        `
      }} />
    </main>
  );
}
