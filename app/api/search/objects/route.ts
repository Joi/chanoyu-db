import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

const SEARCH_RESULT_LIMIT = 12;

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json([]);
  const db = supabaseAdmin();
  const like = `%${q}%`;
  const { data, error } = await db
    .from('objects')
    .select('id, token, title, title_ja, local_number')
    .or(`title.ilike.${like},title_ja.ilike.${like},local_number.ilike.${like},token.ilike.${like}`)
    .limit(SEARCH_RESULT_LIMIT);
  if (error) {
    console.error('[search/objects] error', error);
    return NextResponse.json({ error: 'Failed to search objects' }, { status: 500 });
  }
  return NextResponse.json(data || []);
}


