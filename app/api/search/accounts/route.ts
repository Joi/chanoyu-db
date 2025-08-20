import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

const SEARCH_RESULT_LIMIT = 12;

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json([]);
  const db = supabaseAdmin();
  const like = `%${q}%`;
  const { data, error } = await db
    .from('accounts')
    .select('id, full_name_en, full_name_ja, email')
    .or(`full_name_en.ilike.${like},full_name_ja.ilike.${like},email.ilike.${like}`)
    .limit(SEARCH_RESULT_LIMIT);
  if (error) {
    console.error('[search/accounts] error', { message: error.message, details: error.details });
    return NextResponse.json({ code: 'SEARCH_ACCOUNTS_FAILED', message: 'Failed to search accounts' }, { status: 500 });
  }
  return NextResponse.json(data || []);
}


