import { supabaseAdmin } from '@/lib/supabase/server';
import { currentUserEmail, requireAdmin } from '@/lib/auth';

export default async function TeaRoomsListPage() {
  const email = await currentUserEmail();
  const isPrivileged = await requireAdmin();
  const db = supabaseAdmin();

  const { data: all, error } = await db
    .from('locations')
    .select('id, name, name_en, name_ja, address, address_en, address_ja, url, local_number, visibility, contained_in, contained_in_en, contained_in_ja')
    .order('name', { ascending: true })
    .limit(500);
  if (error) console.error('[tea-rooms] query error', error.message || error);
  let list = Array.isArray(all) ? all : [];

  if (!isPrivileged) {
    if (email) {
      const { data: attended } = await db
        .from('chakai_attendees')
        .select('chakai_id, accounts!inner(email), chakai:chakai!inner(location_id)')
        .eq('accounts.email', email);
      const allowedLocationIds = new Set((attended || []).map((r: any) => r.chakai?.location_id).filter(Boolean));
      list = list.filter((l: any) => l.visibility === 'public' || allowedLocationIds.has(l.id));
    } else {
      list = list.filter((l: any) => l.visibility === 'public');
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Tea Rooms</h1>
      {!list.length ? (
        <div className="card">No tea rooms available.</div>
      ) : (
        <div className="grid" style={{ gap: 8 }}>
          {list.map((l: any) => (
            <div key={l.id} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
              <div>
                <div className="font-medium"><a className="underline" href={`/tea-rooms/${l.id}`}>{l.name_en || l.name_ja || l.name}{l.local_number ? ` (${l.local_number})` : ''}</a></div>
                <div className="text-sm text-gray-700">{l.address_en || l.address_ja || l.address || '—'}{l.url ? ` · ${l.url}` : ''} · {l.visibility}</div>
              </div>
              {(l as any).contained_in_en || (l as any).contained_in_ja || (l as any).contained_in ? (
                <div className="text-xs text-gray-600">Contained in: {(l as any).contained_in_en || (l as any).contained_in_ja || (l as any).contained_in}</div>
              ) : null}
              <div className="text-xs text-gray-600">{l.visibility}</div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}


