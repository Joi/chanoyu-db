import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

const SEARCH_RESULT_LIMIT = 12;

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json([]);
  const db = supabaseAdmin();
  const like = `%${q}%`;
  const { data, error } = await db
    .from('locations')
    .select('id, name, name_en, name_ja, address, address_en, address_ja, url, local_number, visibility, contained_in, contained_in_en, contained_in_ja')
    .or(`name.ilike.${like},name_en.ilike.${like},name_ja.ilike.${like},address.ilike.${like},address_en.ilike.${like},address_ja.ilike.${like},contained_in.ilike.${like},contained_in_en.ilike.${like},contained_in_ja.ilike.${like},url.ilike.${like},local_number.ilike.${like}`)
    .order('name', { ascending: true })
    .limit(SEARCH_RESULT_LIMIT);
  if (error) {
    console.error('[search/locations] error', { message: error.message, details: error.details });
    return NextResponse.json({ code: 'SEARCH_LOCATIONS_FAILED', message: 'Failed to search locations' }, { status: 500 });
  }
  return NextResponse.json(data || []);
}


