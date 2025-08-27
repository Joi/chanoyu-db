import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

type Row = {
  id: string;
  token: string | null;
  local_number: string | null;
  label_en: string | null;
  label_ja: string | null;
  parent_id: string | null;
};

export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get('q') || '').trim();
  // Sanitize search term to mitigate PostgREST OR param injection and wildcard abuse
  const trimmed = raw.slice(0, 64);
  // Allow letters/numbers/space/basic punctuation; drop commas/parentheses which have meaning in PostgREST OR syntax
  const safe = trimmed.replace(/[\t\n\r]/g, ' ').replace(/[(),"']/g, '');
  // Escape LIKE special chars
  const esc = safe.replace(/[\\%_]/g, (m) => `\\${m}`);
  const q = esc;
  if (!q) return NextResponse.json([]);
  const db = supabaseAdmin();

  // Find candidate classes by label or human ID
  const { data: classes } = await db
    .from('local_classes')
    .select('id, token, local_number, label_en, label_ja, parent_id')
    .or(`label_en.ilike.%${q}%,label_ja.ilike.%${q}%,local_number.ilike.%${q}%`)
    .order('local_number', { ascending: true })
    .limit(50);

  const list: Row[] = Array.isArray(classes) ? (classes as any) : [];
  if (!list.length) return NextResponse.json([]);

  const ids = list.map((r) => r.id);

  // Fetch counts (direct and total) in parallel
  const [directCountsRes, totalCountsRes] = await Promise.all([
    db.from('local_class_object_counts_direct').select('local_class_id, object_count').in('local_class_id', ids),
    db.from('local_class_object_counts_total').select('local_class_id, object_count').in('local_class_id', ids),
  ]);

  const directCounts = new Map<string, number>();
  for (const r of (directCountsRes?.data as any[]) || []) directCounts.set(String(r.local_class_id), Number(r.object_count || 0));
  const totalCounts = new Map<string, number>();
  for (const r of (totalCountsRes?.data as any[]) || []) totalCounts.set(String(r.local_class_id), Number(r.object_count || 0));

  // Build parent breadcrumb using closure table
  const { data: closure } = await db
    .from('local_class_hierarchy')
    .select('ancestor_id, descendant_id, depth')
    .in('descendant_id', ids);

  const ancestorIds = Array.from(new Set(((closure || []) as any[]).map((r) => String((r as any).ancestor_id))));
  const needAncestorIds = ancestorIds.filter((aid) => !ids.includes(aid));
  const { data: ancestorRows } = needAncestorIds.length
    ? await db
        .from('local_classes')
        .select('id, local_number, label_en, label_ja')
        .in('id', needAncestorIds)
    : { data: [] } as any;

  const byId: Record<string, Row> = Object.create(null);
  for (const r of list) byId[r.id] = r;
  for (const a of (ancestorRows as any[]) || []) {
    byId[String(a.id)] = {
      id: String(a.id),
      token: null,
      local_number: (a as any).local_number || null,
      label_en: (a as any).label_en || null,
      label_ja: (a as any).label_ja || null,
      parent_id: null,
    };
  }

  const closureByDesc: Record<string, { ancestor_id: string; depth: number }[]> = Object.create(null);
  for (const r of ((closure || []) as any[])) {
    const d = String((r as any).descendant_id);
    if (!closureByDesc[d]) closureByDesc[d] = [];
    closureByDesc[d].push({ ancestor_id: String((r as any).ancestor_id), depth: Number((r as any).depth) });
  }

  const makeTitle = (row: Row): string => {
    return String(row.label_ja || row.label_en || row.local_number || row.token || row.id);
  };

  const results = list.map((row) => {
    const crumbs = (closureByDesc[row.id] || [])
      .filter((r) => r.ancestor_id !== row.id)
      .sort((a, b) => a.depth - b.depth)
      .map((r) => {
        const a = byId[r.ancestor_id];
        return a ? makeTitle(a) : r.ancestor_id;
      });
    const direct = directCounts.get(row.id) || 0;
    const total = totalCounts.get(row.id) || direct;
    const title = makeTitle(row);
    const display = `${title}${row.local_number ? ` · ${row.local_number}` : ''} · ${total} items`;
    return {
      id: row.id,
      token: row.token,
      local_number: row.local_number,
      label_en: row.label_en,
      label_ja: row.label_ja,
      parent_path: crumbs,
      object_count_direct: direct,
      object_count_total: total,
      display,
    };
  });

  // Prefer those with more usage
  results.sort((a, b) => (b.object_count_total - a.object_count_total) || (a.display.localeCompare(b.display)));
  const headers = new Headers();
  headers.set('Cache-Control', 'public, max-age=30, s-maxage=30');
  headers.set('CDN-Cache-Control', 'public, max-age=30, s-maxage=30');
  return NextResponse.json(results, { headers });
}


