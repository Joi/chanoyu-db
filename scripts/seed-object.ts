import 'dotenv/config';
import { supabaseAdmin } from '@/lib/supabase/server';
import { mintToken } from '@/lib/id';

async function main() {
  const token = mintToken(12);
  const db = supabaseAdmin();

  // 1) Create an object shell
  const { data: obj, error: objectInsertError } = await db
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
  if (objectInsertError || !obj) throw objectInsertError || new Error('Insert failed');

  // 2) Ensure the external authority concept exists (AAT Tea bowls)
  const aatUri = 'http://vocab.getty.edu/aat/300193015';
  const { data: classification, error: upsertClassificationError } = await db
    .from('classifications')
    .upsert({ scheme: 'aat', uri: aatUri, label: 'Tea bowls', label_ja: '茶碗' }, { onConflict: 'uri' })
    .select()
    .single();
  if (upsertClassificationError || !classification)
    throw upsertClassificationError || new Error('Classification upsert failed');

  // 3) Find or create a Local Class for this concept
  // Try: does a local class already link to this classification?
  const { data: existingLinks, error: linkQueryError } = await db
    .from('local_class_links')
    .select('local_class_id')
    .eq('classification_id', classification.id)
    .limit(1);
  if (linkQueryError) throw linkQueryError;

  let localClassId: string | null = existingLinks?.[0]?.local_class_id ?? null;
  if (!localClassId) {
    // Create a new Local Class
    const classToken = mintToken();
    const { data: createdClass, error: createClassError } = await db
      .from('local_classes')
      .insert({ token: classToken, label_en: 'Tea bowls', label_ja: '茶碗', description: 'Seeded class' })
      .select('id')
      .single();
    if (createClassError || !createdClass)
      throw createClassError || new Error('Local class create failed');
    localClassId = String((createdClass as any).id);

    // Link the Local Class to the classification and set preferred
    const { error: linkInsertError } = await db
      .from('local_class_links')
      .upsert({ classification_id: classification.id, local_class_id: localClassId });
    if (linkInsertError) throw linkInsertError;

    const { error: setPreferredError } = await db
      .from('local_classes')
      .update({ preferred_classification_id: classification.id })
      .eq('id', localClassId);
    if (setPreferredError) throw setPreferredError;
  }

  // 4) Attach the Local Class to the object
  const { error: updateObjectError } = await db
    .from('objects')
    .update({ primary_local_class_id: localClassId })
    .eq('id', obj.id);
  if (updateObjectError) throw updateObjectError;

  console.log(`https://collection.ito.com/id/${token}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
