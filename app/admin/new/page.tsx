import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { mintToken } from '@/lib/id';

async function createObject(formData: FormData): Promise<void> {
  'use server';
  const title = String(formData.get('title') || '').trim();
  const title_ja = String(formData.get('title_ja') || '').trim() || null;
  const local_number = String(formData.get('local_number') || '').trim() || null;

  if (!title) return;

  const token = mintToken(12);
  const db = supabaseAdmin();
  const { error } = await db.from('objects').insert({
    token,
    title,
    title_ja,
    local_number,
    visibility: 'public',
  });
  if (error) return;
  revalidatePath(`/id/${token}`);
  redirect(`/admin/${token}`);
}

export default function NewObjectPage() {
  // Deprecated page: redirect to Items to add via admin flow
  redirect('/admin/items');
}
