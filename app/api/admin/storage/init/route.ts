import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const db = supabaseAdmin();
  try {
    // @ts-ignore
    const info = await (db as any).storage.getBucket('media');
    const exists = info && !info.error && info.data != null;
    if (!exists) {
      // @ts-ignore
      const created = await (db as any).storage.createBucket('media', { public: true });
      if (created?.error) throw created.error;
    }
    // Verify and return a small sample
    // @ts-ignore
    const list = await (db as any).storage.from('media').list('', { limit: 5 });
    const files = Array.isArray(list?.data) ? list.data.map((f: any) => ({ name: f.name, id: f.id || null })) : [];
    return NextResponse.json({ ok: true, bucketCreated: !exists, sample: files });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}


