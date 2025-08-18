import { supabaseAdmin } from '@/lib/supabase/server';

export default async function TeaSchoolSelect({ name, defaultValue }: { name: string; defaultValue?: string }) {
  const db = supabaseAdmin();
  const { data: schools } = await db.from('tea_schools').select('id, name_en, name_ja').order('name_en');
  return (
    <select name={name} className="input" defaultValue={defaultValue || ''}>
      <option value="">(none)</option>
      {(schools || []).map((s: any) => (
        <option key={s.id} value={s.id}>{s.name_en || s.name_ja}</option>
      ))}
    </select>
  );
}


