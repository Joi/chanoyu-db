import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

const SEARCH_RESULT_LIMIT = 12;

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json([]);
  const db = supabaseAdmin();
  const like = `%${q}%`;
  const { data, error } = await db
    .from('chakai')
    .select('id, name_en, name_ja, local_number, event_date')
    .or(`name_en.ilike.${like},name_ja.ilike.${like},local_number.ilike.${like}`)
    .order('event_date', { ascending: false })
    .limit(SEARCH_RESULT_LIMIT);
  if (error) {
    console.error('[search/chakai] error', { message: error.message, details: error.details });
    return NextResponse.json({ code: 'SEARCH_CHAKAI_FAILED', message: 'Failed to search chakai' }, { status: 500 });
  }
  return NextResponse.json(data || []);
}


