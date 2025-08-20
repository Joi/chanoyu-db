import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

export default async function ChakaiAdminList() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return redirect('/login');

  const db = supabaseAdmin();
  const { data: rows, error } = await db
    .from('chakai')
    .select('id, name_en, name_ja, local_number, event_date, start_time, visibility, location_id')
    .order('event_date', { ascending: false })
    .limit(500);
  if (error) console.error('[admin/chakai] query error', error.message || error);
  const list = Array.isArray(rows) ? rows : [];
  const locationIds = Array.from(new Set(list.map((r: any) => r.location_id).filter(Boolean)));
  let locationsById: Record<string, any> = {};
  if (locationIds.length) {
    const { data: locs } = await db
      .from('locations')
      .select('id, name')
      .in('id', locationIds);
    for (const l of locs || []) locationsById[(l as any).id] = l;
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Chakai</h1>
        <a className="button" href="/admin/chakai/new">Add Chakai</a>
      </div>
      {!list.length ? (
        <div className="card">No chakai found.</div>
      ) : (
        <div className="grid" style={{ gap: 8 }}>
          {list.map((c: any) => {
            const loc = c.location_id ? locationsById[c.location_id] : null;
            const date = c.event_date ? new Date(c.event_date).toISOString().slice(0, 10) : '';
            const time = c.start_time ? String(c.start_time).slice(0, 5) : '';
            const title = c.name_en || c.name_ja || c.local_number || date;
            return (
              <div key={c.id} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
                <div>
                  <div className="font-medium"><a className="underline" href={`/chakai/${c.id}`}>{title}</a>{c.name_en && c.name_ja ? <span className="text-sm text-gray-700 ml-2" lang="ja">/ {c.name_ja}</span> : null}</div>
                  <div className="text-sm text-gray-700">{date}{time ? ` ${time}` : ''}{loc ? ` · ${loc.name}` : ''} · {c.visibility}{c.local_number ? ` · ${c.local_number}` : ''}</div>
                </div>
                <div className="flex items-center gap-4">
                  <a className="text-sm underline leading-none" href={`/chakai/${c.id}`}>View</a>
                  <a className="text-sm underline leading-none" href={`/admin/chakai/${c.id}`}>Edit</a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}


