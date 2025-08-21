import { NextResponse } from 'next/server';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  return NextResponse.json({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
    hasAnon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasService: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  });
}


