import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  const email = (req.nextUrl.searchParams.get('email') || '').trim();
  if (!email) return NextResponse.json({ error: 'missing email' }, { status: 400 });

  try {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from('accounts')
      .select('id, email, role')
      .eq('email', email)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
    return NextResponse.json({ exists: Boolean(data), role: (data as any)?.role || null });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}


