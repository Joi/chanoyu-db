import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  const email = (req.nextUrl.searchParams.get('email') || '').trim();
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) return NextResponse.json({ error: 'env missing' }, { status: 500 });
  const q = email ? `&email=eq.${encodeURIComponent(email)}` : '';
  const endpoint = `${url}/rest/v1/accounts?select=id,email,role&limit=1${q}`;
  try {
    const r = await fetch(endpoint, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    const text = await r.text();
    return NextResponse.json({ ok: r.ok, status: r.status, text });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}


