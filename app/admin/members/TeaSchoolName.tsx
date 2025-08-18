import { supabaseAdmin } from '@/lib/supabase/server';

export default async function TeaSchoolName({ teaSchoolId, website }: { teaSchoolId?: string | null; website?: string | null }) {
  const db = supabaseAdmin();
  let label: string = '—';
  if (teaSchoolId) {
    const { data } = await db.from('tea_schools').select('name_en, name_ja').eq('id', teaSchoolId).maybeSingle();
    if (data) label = (data as any).name_en || (data as any).name_ja || '—';
  }
  return (
    <div className="text-xs text-gray-600" style={{ minWidth: 200 }}>
      {label}
      {website ? <span> · <a className="underline" href={website} target="_blank" rel="noreferrer">Website</a></span> : null}
    </div>
  );
}


