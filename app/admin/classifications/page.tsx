import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ClassificationsIndex({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const db = supabaseAdmin();

  const q = typeof searchParams?.q === 'string' ? String(searchParams!.q) : '';
  const scheme = typeof searchParams?.scheme === 'string' ? String(searchParams!.scheme) : '';

  let query = db
    .from('classifications')
    .select('id, scheme, uri, label, label_ja, kind')
    .order('scheme')
    .order('label')
    .limit(500);
  if (q) {
    query = query.ilike('label', `%${q}%`);
  }
  if (scheme) {
    query = query.eq('scheme', scheme);
  }
  const { data: classes } = await query;
  const list = Array.isArray(classes) ? classes : [];

  // Fetch counts for the listed classification ids
  const ids = list.map((c: any) => c.id);
  const counts: Record<string, number> = {};
  if (ids.length) {
    const { data: links } = await db
      .from('object_classifications')
      .select('classification_id')
      .in('classification_id', ids);
    for (const r of links || []) {
      const cid = (r as any).classification_id as string;
      counts[cid] = (counts[cid] || 0) + 1;
    }
  }

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Classifications</h1>
      <form className="mb-4" style={{ display: 'flex', gap: 8 }}>
        <input name="q" className="input" placeholder="Search label" defaultValue={q} />
        <input name="scheme" className="input" placeholder="Scheme (e.g., aat, wikidata)" defaultValue={scheme} />
      </form>
      <div className="grid" style={{ gap: 8 }}>
        {list.map((c: any) => (
          <div key={c.id} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
            <div>
              <div className="text-sm"><strong>{c.label || c.uri}</strong>{c.label_ja ? <span lang="ja"> / {c.label_ja}</span> : null}</div>
              <div className="text-xs text-gray-600">{c.scheme} · <a className="underline" href={c.uri} target="_blank" rel="noreferrer">{c.uri}</a></div>
            </div>
            <div className="text-xs">
              <a className="underline" href={`/admin/classifications/${c.id}`}>Open</a>
              <span className="text-gray-600"> · {counts[c.id] || 0} objects</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}


