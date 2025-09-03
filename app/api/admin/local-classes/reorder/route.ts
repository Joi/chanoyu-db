import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

export async function POST(req: Request) {
  const ok = await requireAdmin();
  if (!ok) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  const form = await req.formData();
  const classId = String(form.get('class_id') || '').trim();
  const direction = String(form.get('direction') || '').trim();
  if (!classId || (direction !== 'up' && direction !== 'down')) {
    return NextResponse.redirect(new URL('/admin/local-classes', req.url));
  }
  const db = supabaseAdmin();
  const { data: rows } = await db
    .from('local_classes')
    .select('id, sort_order, local_number')
    .is('parent_id', null)
    .order('sort_order', { ascending: true, nullsFirst: true })
    .order('local_number');
  const list = (rows || []) as Array<{ id: string; sort_order: number | null; local_number: string | null }>;
  const idx = list.findIndex((r) => String(r.id) === classId);
  if (idx < 0) return NextResponse.redirect(new URL('/admin/local-classes', req.url));
  const neighbor = direction === 'up' ? idx - 1 : idx + 1;
  if (neighbor < 0 || neighbor >= list.length) return NextResponse.redirect(new URL('/admin/local-classes', req.url));
  const orderedIds = list.map((r) => String(r.id));
  const tmp = orderedIds[idx];
  orderedIds[idx] = orderedIds[neighbor];
  orderedIds[neighbor] = tmp;
  const updates = orderedIds.map((id, i) => db.from('local_classes').update({ sort_order: i + 1 }).eq('id', id));
  await Promise.all(updates);
  return NextResponse.redirect(new URL('/admin/local-classes', req.url));
}


