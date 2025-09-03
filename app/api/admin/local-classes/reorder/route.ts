import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function handle(classId: string, direction: string, req: Request) {
  const ok = await requireAdmin();
  if (!ok) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
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
  console.log('[reorder] before:', list.map((r, i) => ({ i, id: r.id, sort: r.sort_order })));
  const updates = orderedIds.map((id, i) => db.from('local_classes').update({ sort_order: i + 1 }).eq('id', id));
  const results = await Promise.all(updates);
  const err = results.find((r) => (r as any)?.error);
  if (err && (err as any).error) {
    console.error('[reorder] update error', (err as any).error?.message || (err as any).error);
  }
  const { data: after } = await db
    .from('local_classes')
    .select('id, sort_order')
    .is('parent_id', null)
    .order('sort_order', { ascending: true, nullsFirst: true })
    .order('local_number');
  console.log('[reorder] after:', (after || []).map((r: any, i: number) => ({ i, id: r.id, sort: r.sort_order })));
  revalidatePath('/admin/local-classes');
  return NextResponse.redirect(new URL('/admin/local-classes', req.url));
}

export async function POST(req: Request) {
  const ok = await requireAdmin();
  if (!ok) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  const form = await req.formData();
  const classId = String(form.get('class_id') || '').trim();
  const direction = String(form.get('direction') || '').trim();
  return handle(classId, direction, req);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const classId = String(url.searchParams.get('class_id') || '').trim();
  const direction = String(url.searchParams.get('direction') || '').trim();
  return handle(classId, direction, req);
}


