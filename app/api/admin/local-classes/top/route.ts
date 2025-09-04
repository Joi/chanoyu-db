import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ ok: false }, { status: 403 });
  const db = supabaseAdmin();
  const { data, error } = await db
    .from('local_classes')
    .select('id, label_en, label_ja, local_number, sort_order')
    .is('parent_id', null)
    .order('sort_order', { ascending: true, nullsFirst: true })
    .order('local_number');
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}


