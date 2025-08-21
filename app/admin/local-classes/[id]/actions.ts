'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

export async function updateLocalClassAction(formData: FormData) {
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const cid = String(formData.get('class_id') || '').trim();
  const label_en = String(formData.get('label_en') || '').trim() || null;
  const label_ja = String(formData.get('label_ja') || '').trim() || null;
  const description = String(formData.get('description') || '').trim() || null;
  const parentRaw = String(formData.get('parent_local_class_id') || '').trim();
  const parent_id = parentRaw && /^[0-9a-fA-F-]{36}$/.test(parentRaw) ? parentRaw : null;
  if (!cid) return redirect('/admin/local-classes');
  const db = supabaseAdmin();
  const { error } = await db.from('local_classes').update({ label_en, label_ja, description, parent_id }).eq('id', cid);
  if (error) {
    console.error('[local-class:update] error', error.message || error);
    redirect(`/admin/local-classes/${cid}?error=update`);
  }
  revalidatePath(`/admin/local-classes/${cid}`);
  redirect(`/admin/local-classes/${cid}?saved=update`);
}

export async function addChildServerAction(formData: FormData) {
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const parent_id = String(formData.get('parent_id') || '').trim();
  const label_en = String(formData.get('child_label_en') || '').trim() || null;
  const label_ja = String(formData.get('child_label_ja') || '').trim() || null;
  if (!parent_id) return redirect('/admin/local-classes');
  const db = supabaseAdmin();
  const { error } = await db.from('local_classes').insert({ parent_id, label_en, label_ja });
  if (error) {
    console.error('[local-class:add-child] error', error.message || error);
    redirect(`/admin/local-classes/${parent_id}?error=add-child`);
  }
  revalidatePath(`/admin/local-classes/${parent_id}`);
  redirect(`/admin/local-classes/${parent_id}?saved=child`);
}

export async function detachChildServerAction(formData: FormData) {
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const parent_id = String(formData.get('parent_id') || '').trim();
  const childId = String(formData.get('child_id') || '').trim();
  if (!parent_id || !childId) return redirect('/admin/local-classes');
  const db = supabaseAdmin();
  const { error } = await db.from('local_classes').update({ parent_id: null }).eq('id', childId);
  if (error) {
    console.error('[local-class:detach-child] error', error.message || error);
    redirect(`/admin/local-classes/${parent_id}?error=detach-child`);
  }
  revalidatePath(`/admin/local-classes/${parent_id}`);
  redirect(`/admin/local-classes/${parent_id}?saved=detach-child`);
}

export async function attachExistingChildServerAction(formData: FormData) {
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const parent_id = String(formData.get('parent_id') || '').trim();
  const raw = String(formData.get('attach_child_ids') || '').trim();
  const ids = raw ? [raw] : [];
  if (ids.length && !/^[0-9a-fA-F-]{36}$/.test(ids[0])) {
    redirect(`/admin/local-classes/${parent_id}?error=invalid-child`);
  }
  if (!parent_id || !ids.length) return redirect(`/admin/local-classes/${parent_id}`);
  const db = supabaseAdmin();
  const updates = ids.map((id) => db.from('local_classes').update({ parent_id }).eq('id', id));
  const res = await Promise.all(updates);
  const err = res.find((r) => (r as any)?.error);
  if (err && (err as any).error) {
    console.error('[local-class:attach-existing] error', (err as any).error?.message || (err as any).error);
    redirect(`/admin/local-classes/${parent_id}?error=attach-child`);
  }
  revalidatePath(`/admin/local-classes/${parent_id}`);
  redirect(`/admin/local-classes/${parent_id}?saved=attach-child`);
}

export async function deleteLocalClassServerAction(formData: FormData) {
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const cid = String(formData.get('class_id') || '').trim();
  if (!cid) return redirect('/admin/local-classes');
  const db = supabaseAdmin();
  const { error } = await db.from('local_classes').delete().eq('id', cid);
  if (error) {
    console.error('[local-class:delete] error', error.message || error);
    redirect(`/admin/local-classes/${cid}?error=delete`);
  }
  revalidatePath('/admin/local-classes');
  redirect('/admin/local-classes?saved=deleted');
}

// External link actions
export async function addExistingExternalLinkAction(formData: FormData) {
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const class_id = String(formData.get('class_id') || '').trim();
  const classification_id = String(formData.get('classification_id') || '').trim();
  if (!class_id || !classification_id) return redirect('/admin/local-classes');
  const db = supabaseAdmin();
  // Ensure classification exists
  const { data: exists } = await db.from('classifications').select('id').eq('id', classification_id).maybeSingle();
  if (!exists) return redirect(`/admin/local-classes/${class_id}?error=ext-missing`);
  const { error } = await db.from('local_class_links').upsert({ local_class_id: class_id, classification_id });
  if (error) return redirect(`/admin/local-classes/${class_id}?error=ext-link`);
  revalidatePath(`/admin/local-classes/${class_id}`);
  redirect(`/admin/local-classes/${class_id}?saved=ext-add`);
}
export async function addExternalLinkAction(formData: FormData) {
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const class_id = String(formData.get('class_id') || '').trim();
  const scheme = String(formData.get('scheme') || '').trim().toLowerCase();
  const uri = String(formData.get('uri') || '').trim();
  const label = String(formData.get('label') || '').trim() || null;
  const label_ja = String(formData.get('label_ja') || '').trim() || null;
  if (!class_id || !scheme || !uri) return redirect(`/admin/local-classes/${class_id}?error=ext-missing`);
  const db = supabaseAdmin();
  const { data: existing } = await db.from('classifications').select('id').eq('scheme', scheme).eq('uri', uri).maybeSingle();
  let classification_id = existing?.id as string | undefined;
  if (!classification_id) {
    const { data: ins, error: insErr } = await db.from('classifications').insert({ scheme, uri, label, label_ja, kind: 'concept' }).select('id').single();
    if (insErr || !ins) return redirect(`/admin/local-classes/${class_id}?error=ext-insert`);
    classification_id = String(ins.id);
  }
  const { error: linkErr } = await db.from('local_class_links').upsert({ local_class_id: class_id, classification_id });
  if (linkErr) return redirect(`/admin/local-classes/${class_id}?error=ext-link`);
  revalidatePath(`/admin/local-classes/${class_id}`);
  redirect(`/admin/local-classes/${class_id}?saved=ext-add`);
}

export async function removeExternalLinkAction(formData: FormData) {
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const class_id = String(formData.get('class_id') || '').trim();
  const classification_id = String(formData.get('classification_id') || '').trim();
  if (!class_id || !classification_id) return redirect('/admin/local-classes');
  const db = supabaseAdmin();
  await db.from('local_class_links').delete().eq('local_class_id', class_id).eq('classification_id', classification_id);
  revalidatePath(`/admin/local-classes/${class_id}`);
  redirect(`/admin/local-classes/${class_id}?saved=ext-remove`);
}

export async function setPreferredExternalAction(formData: FormData) {
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const class_id = String(formData.get('class_id') || '').trim();
  const classification_id = String(formData.get('classification_id') || '').trim();
  if (!class_id || !classification_id) return redirect('/admin/local-classes');
  const db = supabaseAdmin();
  const { error } = await db.from('local_classes').update({ preferred_classification_id: classification_id }).eq('id', class_id);
  if (error) return redirect(`/admin/local-classes/${class_id}?error=ext-preferred`);
  revalidatePath(`/admin/local-classes/${class_id}`);
  redirect(`/admin/local-classes/${class_id}?saved=ext-preferred`);
}