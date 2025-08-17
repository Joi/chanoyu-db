import 'dotenv/config';
import { supabaseAdmin } from '@/lib/supabase/server';
import { mintToken } from '@/lib/id';

async function main() {
  const token = mintToken(12);
  const db = supabaseAdmin();

  const { data: obj, error: e1 } = await db
    .from('objects')
    .insert({
      token,
      title: 'Black Raku chawan',
      local_number: 'ITO-2025-001',
      visibility: 'public',
      summary: 'A black Raku tea bowl.',
    })
    .select()
    .single();

  if (e1 || !obj) throw e1 || new Error('Insert failed');

  const aatUri = 'http://vocab.getty.edu/aat/300193015';
  const { data: cls, error: e2 } = await db
    .from('classifications')
    .upsert({ scheme: 'aat', uri: aatUri, label: 'Tea bowls', label_ja: '茶碗' }, { onConflict: 'uri' })
    .select()
    .single();
  if (e2 || !cls) throw e2 || new Error('Classification upsert failed');

  const { error: e3 } = await db
    .from('object_classifications')
    .insert({ object_id: obj.id, classification_id: cls.id, role: 'primary type' });
  if (e3) throw e3;

  console.log(`https://collection.ito.com/id/${token}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
