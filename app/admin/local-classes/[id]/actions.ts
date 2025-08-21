'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

// Proper UUID validation schema
const uuidSchema = z.string().uuid();

// Form validation schemas
const updateLocalClassSchema = z.object({
  class_id: uuidSchema,
  label_en: z.string().max(255).optional(),
  label_ja: z.string().max(255).optional(), 
  description: z.string().max(2000).optional(),
  parent_local_class_id: z.union([uuidSchema, z.literal('')]).optional(),
});

const externalLinkSchema = z.object({
  class_id: uuidSchema,
  scheme: z.enum(['aat', 'wikidata']),
  uri: z.string().url().max(500),
  label: z.string().max(255).optional(),
  label_ja: z.string().max(255).optional(),
});

export async function updateLocalClassAction(formData: FormData) {
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  
  // Validate input data with Zod
  const rawData = {
    class_id: String(formData.get('class_id') || '').trim(),
    label_en: String(formData.get('label_en') || '').trim() || undefined,
    label_ja: String(formData.get('label_ja') || '').trim() || undefined,
    description: String(formData.get('description') || '').trim() || undefined,
    parent_local_class_id: String(formData.get('parent_local_class_id') || '').trim() || undefined,
  };
  
  const validation = updateLocalClassSchema.safeParse(rawData);
  if (!validation.success) {
    console.error('[local-class:update] validation error', validation.error.flatten());
    return redirect('/admin/local-classes?error=validation');
  }
  
  const { class_id: cid, label_en, label_ja, description, parent_local_class_id } = validation.data;
  const parent_id = parent_local_class_id === '' ? null : parent_local_class_id;
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
  if (ids.length && !uuidSchema.safeParse(ids[0]).success) {
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
  
  // Validate input data with Zod
  const rawData = {
    class_id: String(formData.get('class_id') || '').trim(),
    scheme: String(formData.get('scheme') || '').trim().toLowerCase(),
    uri: String(formData.get('uri') || '').trim(),
    label: String(formData.get('label') || '').trim() || undefined,
    label_ja: String(formData.get('label_ja') || '').trim() || undefined,
  };
  
  const validation = externalLinkSchema.safeParse(rawData);
  if (!validation.success) {
    console.error('[local-class:add-ext-link] validation error', validation.error.flatten());
    const class_id = rawData.class_id;
    return redirect(`/admin/local-classes/${class_id}?error=ext-validation`);
  }
  
  const { class_id, scheme, uri, label, label_ja } = validation.data;
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
  const { error } = await db.from('local_class_links').delete().eq('local_class_id', class_id).eq('classification_id', classification_id);
  if (error) {
    console.error('[local-class:remove-ext-link] error', error.message || error);
    return redirect(`/admin/local-classes/${class_id}?error=ext-remove`);
  }
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