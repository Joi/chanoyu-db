import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import SearchSelect from '@/app/components/SearchSelect';
import { z } from 'zod';
import { createChakaiSchema } from '@/lib/chakai';
import { requireAdmin } from '@/lib/auth';
import { mintToken } from '@/lib/id';

async function createChakai(formData: FormData) {
  'use server';
  const isAdmin = await requireAdmin();
  if (!isAdmin) return redirect('/login');

  const parsed = createChakaiSchema.safeParse(Object.fromEntries(formData as any));
  if (!parsed.success) {
    const first = parsed.error.issues?.[0];
    const msg = first ? `${first.path.join('.')}: ${first.message}` : 'Invalid input.';
    throw new Error(`Invalid input. ${msg}`);
  }
  const { name_en, name_ja, event_date, start_time, visibility, notes, location_id, location_name_en, location_name_ja, location_address_en, location_address_ja, location_url } = parsed.data as any;

  const db = supabaseAdmin();

  let locationId: string | null = (location_id as string) || null;
  if (!locationId && (location_name_en || location_name_ja)) {
    const { data: loc } = await db
      .from('locations')
      .insert({
        name: location_name_en || location_name_ja,
        name_en: location_name_en || null,
        name_ja: location_name_ja || null,
        address: location_address_en || location_address_ja || null,
        address_en: location_address_en || null,
        address_ja: location_address_ja || null,
        url: location_url || null,
        token: mintToken(),
      })
      .select('id')
      .single();
    locationId = (loc as any)?.id || null;
  }
  if (!locationId) {
    throw new Error('Tea Room is required. Select an existing tea room or create a new one.');
  }

  const payload: any = {
    name_en: name_en || null,
    name_ja: name_ja || null,
    event_date,
    start_time: start_time || null,
    visibility,
    notes: notes || null,
    location_id: locationId,
    token: mintToken(),
  };
  const { data: inserted, error } = await db
    .from('chakai')
    .insert(payload)
    .select('id')
    .single();
  if (error) throw error;

  const chakaiId = (inserted as any).id as string;

  const attendeeIds = String(formData.get('attendee_ids') || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (attendeeIds.length) {
    await db.from('chakai_attendees').insert(attendeeIds.map((aid) => ({ chakai_id: chakaiId, account_id: aid })));
  }
  const itemIds = String(formData.get('item_ids') || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (itemIds.length) {
    await db.from('chakai_items').insert(itemIds.map((oid) => ({ chakai_id: chakaiId, object_id: oid })));
  }

  revalidatePath('/admin/chakai');
  return redirect('/admin/chakai');
}

export default async function NewChakaiPage() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return redirect('/login');

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Add Chakai</h1>
      <form action={createChakai} className="grid gap-3">
        <div>
          <label className="block text-sm font-medium">Name (EN)</label>
          <input name="name_en" className="input w-full" placeholder="e.g., Spring Tea Gathering" />
        </div>
        <div>
          <label className="block text-sm font-medium">Name (JA)</label>
          <input name="name_ja" className="input w-full" placeholder="例：春の茶会" />
        </div>
        <div>
          <label className="block text-sm font-medium">Date</label>
          <input type="date" name="event_date" className="input w-full" required />
        </div>
        <div>
          <label className="block text-sm font-medium">Start time</label>
          <input type="time" name="start_time" className="input w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Visibility</label>
          <select name="visibility" className="input w-full">
            <option value="open">Open</option>
            <option value="members">Members</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Notes</label>
          <textarea name="notes" className="input w-full" rows={3} />
        </div>
        <fieldset className="border p-3 rounded">
          <legend className="text-sm font-medium">Tea Room</legend>
          <div className="grid gap-3">
            <SearchSelect name="location_id" label="Select existing tea room" searchPath="/api/search/locations" labelFields={["name_en","name_ja","name","local_number","address_en","address_ja","address"]} valueKey="id" />
            <div className="text-xs text-gray-600">Or create a new tea room:</div>
            <input name="location_name_en" className="input w-full" placeholder="Name (EN)" />
            <input name="location_name_ja" className="input w-full" placeholder="Name (JA)" />
            <input name="location_address_en" className="input w-full" placeholder="Address (EN)" />
            <input name="location_address_ja" className="input w-full" placeholder="Address (JA)" />
            <input name="location_url" className="input w-full" placeholder="URL" />
          </div>
        </fieldset>
        <SearchSelect name="attendee_ids" label="Attendees" searchPath="/api/search/accounts" labelFields={["full_name_en","full_name_ja","email"]} valueKey="id" />
        <SearchSelect name="item_ids" label="Items used" searchPath="/api/search/objects" labelFields={["title","title_ja","local_number","token"]} valueKey="id" />
        <div className="flex gap-3 mt-2">
          <button className="button" type="submit">Create</button>
          <a className="button secondary" href="/admin/chakai">Cancel</a>
        </div>
      </form>
    </main>
  );
}

// Lightweight client component for searching and selecting multiple entities
// old inline selector removed; using client component instead


