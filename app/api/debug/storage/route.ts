import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  const ok = await requireAdmin();
  if (!ok || process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  try {
    const db = supabaseAdmin();
    // Ensure bucket exists
    // @ts-ignore
    const info = await (db as any).storage.getBucket('media');
    const exists = info && !info.error && info.data != null;
    // List a few files (if any)
    // @ts-ignore
    const list = await (db as any).storage.from('media').list('', { limit: 5 });
    const files = Array.isArray(list?.data) ? list.data.map((f: any) => ({ name: f.name, id: f.id || null })) : [];
    return NextResponse.json({ ok: true, bucketExists: exists, sample: files });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}


