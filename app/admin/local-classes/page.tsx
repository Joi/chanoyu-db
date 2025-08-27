import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
 

export const dynamic = 'force-dynamic';

export default async function LocalClassesIndex({ searchParams }: { searchParams?: { [k: string]: string | string[] | undefined } }) {
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const db = supabaseAdmin();

  // Sanitize search query using the same logic as the secure API to prevent SQL injection
  const rawQuery = typeof searchParams?.q === 'string' ? String(searchParams!.q) : '';
  const sanitizeSearchQuery = (raw: string): string => {
    const trimmed = raw.slice(0, 64);
    // Allow letters/numbers/space/basic punctuation; drop commas/parentheses which have meaning in PostgREST OR syntax
    const safe = trimmed.replace(/[\t\n\r]/g, ' ').replace(/[(),"']/g, '');
    // Escape LIKE special chars
    const esc = safe.replace(/[\\%_]/g, (m) => `\\${m}`);
    return esc;
  };
  const q = sanitizeSearchQuery(rawQuery.trim());

  let query = db
    .from('local_classes')
    .select('id, token, local_number, label_en, label_ja, parent_id')
    .order('local_number')
    .limit(1000);
  if (q) {
    // Now safe to use in query since input has been sanitized
    query = query.or([
      `label_en.ilike.%${q}%`,
      `label_ja.ilike.%${q}%`,
      `local_number.ilike.%${q}%`,
    ].join(','));
  }
  const { data: rows } = await query;
  const list = Array.isArray(rows) ? rows : [];
  const ids = list.map((r: any) => r.id);

  const [directCountsRes, totalCountsRes] = ids.length
    ? await Promise.all([
        db.from('local_class_object_counts_direct').select('local_class_id, object_count').in('local_class_id', ids),
        db.from('local_class_object_counts_total').select('local_class_id, object_count').in('local_class_id', ids),
      ])
    : [{ data: [] } as any, { data: [] } as any];

  const directCounts = new Map<string, number>();
  for (const r of (directCountsRes?.data as any[]) || []) directCounts.set(String(r.local_class_id), Number(r.object_count || 0));
  const totalCounts = new Map<string, number>();
  for (const r of (totalCountsRes?.data as any[]) || []) totalCounts.set(String(r.local_class_id), Number(r.object_count || 0));

  // Build maps for tree rendering when no search query
  type RowT = { id: string; token: string | null; local_number: string | null; label_en: string | null; label_ja: string | null; parent_id: string | null };
  const byId: Record<string, RowT> = Object.create(null);
  const childrenOf: Record<string, string[]> = Object.create(null);
  for (const r of list as RowT[]) {
    byId[r.id] = r;
    const pid = r.parent_id || '__root__';
    if (!childrenOf[pid]) childrenOf[pid] = [];
    childrenOf[pid].push(r.id);
  }
  const sortIds = (ids: string[]) => {
    return ids.sort((a, b) => {
      const ra = byId[a];
      const rb = byId[b];
      const la = String(ra.label_ja || ra.label_en || ra.local_number || '').toLowerCase();
      const lb = String(rb.label_ja || rb.label_en || rb.local_number || '').toLowerCase();
      return la.localeCompare(lb);
    });
  };

  const renderTree = (ids: string[], depth = 0): any => {
    if (!ids.length) return null;
    const ordered = sortIds([...ids]);
    return (
      <ul className="grid gap-1" style={{ marginLeft: depth ? 12 : 0 }}>
        {ordered.map((id) => {
          const r = byId[id];
          const labelJa = String(r.label_ja || '').trim();
          const labelEn = String(r.label_en || '').trim();
          const hasJa = !!labelJa;
          const hasEn = !!labelEn;
          const showBoth = hasJa && hasEn && labelJa !== labelEn;
          const title = hasJa ? labelJa : (hasEn ? labelEn : String(r.local_number || r.token || r.id));
          const direct = directCounts.get(id) || 0;
          const total = totalCounts.get(id) || direct;
          const kids = childrenOf[id] || [];
          return (
            <li key={id} className="card">
              <Link href={`/admin/local-classes/${id}`} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium underline">{title}</div>
                  {showBoth ? (
                    <div className="text-xs text-gray-600">{labelEn}</div>
                  ) : null}
                  <div className="text-xs text-gray-600">{r.local_number || r.token}</div>
                </div>
                <div className="text-xs text-gray-700">{direct} direct · {total} total</div>
              </Link>
              {kids.length ? (
                <div className="mt-1">
                  {renderTree(kids, depth + 1)}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Local Classes</h1>
        <Link className="button" href="/admin/local-classes/new">New Local Class</Link>
      </div>
      <form className="flex gap-2 mb-4">
        <input name="q" className="input" placeholder="Search local classes..." defaultValue={q} />
        <button className="button" type="submit">Search</button>
      </form>


      {q ? (
        <ul className="grid gap-2">
          {list.map((r: any) => {
            const labelJa = String(r.label_ja || '').trim();
            const labelEn = String(r.label_en || '').trim();
            const hasJa = !!labelJa;
            const hasEn = !!labelEn;
            const showBoth = hasJa && hasEn && labelJa !== labelEn;
            const title = hasJa ? labelJa : (hasEn ? labelEn : String(r.local_number || r.token || r.id));
            const direct = directCounts.get(String(r.id)) || 0;
            const total = totalCounts.get(String(r.id)) || direct;
            return (
              <li key={r.id} className="card">
                <Link href={`/admin/local-classes/${r.id}`} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium underline">{title}</div>
                    {showBoth ? (
                      <div className="text-xs text-gray-600">{labelEn}</div>
                    ) : null}
                    <div className="text-xs text-gray-600">{r.local_number || r.token}</div>
                  </div>
                  <div className="text-xs text-gray-700">{direct} direct · {total} total</div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="grid gap-2">
          {renderTree(sortIds(childrenOf['__root__'] || []))}
        </div>
      )}
    </main>
  );
}


