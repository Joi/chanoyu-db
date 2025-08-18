import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

export default async function ClassificationsListPage() {
  const ok = await requireAdmin();
  if (!ok) return notFound();
  const db = supabaseAdmin();
  const { data, error } = await db
    .from('classifications')
    .select('id, scheme, uri, label, label_ja')
    .order('scheme', { ascending: true });
  if (error) console.error('[admin/classifications] query error', error.message || error);
  const rows = Array.isArray(data) ? data : [];

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Classifications</h1>
      <div className="grid" style={{ gap: 10 }}>
        {rows.map((c: any) => (
          <div key={c.id} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
            <div>
              <div className="text-sm font-semibold">
                <a className="underline" href={`/admin/classifications/${c.id}`}>{c.label || c.uri}</a>
                {c.label_ja ? <span className="text-sm" lang="ja"> / {c.label_ja}</span> : null}
              </div>
              <div className="text-xs text-gray-600">{c.scheme} · <a className="underline" href={c.uri} target="_blank" rel="noreferrer">{c.uri}</a></div>
            </div>
            <div>
              <a className="button secondary" href={`/admin/classifications/${c.id}`}>Open</a>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}


