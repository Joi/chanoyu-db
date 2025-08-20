import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

type LocationRow = {
  id: string;
  name?: string | null;
  name_en?: string | null;
  name_ja?: string | null;
  address?: string | null;
  address_en?: string | null;
  address_ja?: string | null;
  url?: string | null;
  local_number?: string | null;
  visibility: 'public' | 'private';
  contained_in?: string | null;
  contained_in_en?: string | null;
  contained_in_ja?: string | null;
};

export default async function TeaRoomsAdminList() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return redirect('/login');

  const db = supabaseAdmin();
  const { data: rows, error } = await db
    .from('locations')
    .select('id, name, name_en, name_ja, address, address_en, address_ja, url, local_number, visibility, contained_in, contained_in_en, contained_in_ja')
    .order('name', { ascending: true })
    .limit(500);
  if (error) console.error('[admin/tea-rooms] query error', error.message || error);
  const list: LocationRow[] = Array.isArray(rows) ? (rows as any) : [];

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Tea Rooms</h1>
        <a className="button" href="/admin/tea-rooms/new">Add Tea Room</a>
      </div>
      {!list.length ? (
        <div className="card">No tea rooms found.</div>
      ) : (
        <div className="grid" style={{ gap: 8 }}>
          {list.map((l) => (
            <div key={l.id} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
              <div>
                <div className="font-medium">
                  {(l.name_ja || l.name_en || l.name) || '(unnamed)'}
                  {(l.name_ja && (l.name_en || l.name)) ? <span className="text-sm text-gray-700 ml-2" lang="en">/ {l.name_en || l.name}</span> : null}
                  {l.local_number ? ` (${l.local_number})` : ''}
                </div>
                <div className="text-sm text-gray-700">{l.address_en || l.address_ja || l.address || '—'}{l.url ? ` · ${l.url}` : ''} · {l.visibility}</div>
                {(l.contained_in_en || l.contained_in_ja || l.contained_in) ? (
                  <div className="text-xs text-gray-600">Contained in: {l.contained_in_en || l.contained_in_ja || l.contained_in}</div>
                ) : null}
              </div>
              <div className="flex items-center gap-4">
                <a className="text-sm underline leading-none" href={`/tea-rooms/${l.id}`}>View</a>
                <a className="text-sm underline leading-none" href={`/admin/tea-rooms/${l.id}`}>Edit</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}


