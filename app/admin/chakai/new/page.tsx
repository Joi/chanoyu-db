import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import SearchSelect from '@/app/components/SearchSelect';
import { requireAdmin } from '@/lib/auth';

async function createChakai(formData: FormData) {
  'use server';
  const isAdmin = await requireAdmin();
  if (!isAdmin) return redirect('/login');

  const name_en = String(formData.get('name_en') || '').trim();
  const name_ja = String(formData.get('name_ja') || '').trim();
  const eventDate = String(formData.get('event_date') || '');
  const startTime = String(formData.get('start_time') || '');
  const visibility = String(formData.get('visibility') || 'open');
  const notes = String(formData.get('notes') || '');

  const locationIdExisting = String(formData.get('location_id') || '').trim();
  const locationName = String(formData.get('location_name') || '').trim();
  const locationAddress = String(formData.get('location_address') || '').trim();
  const locationUrl = String(formData.get('location_url') || '').trim();

  const db = supabaseAdmin();

  let locationId: string | null = locationIdExisting || null;
  if (!locationId && locationName) {
    const { data: loc } = await db
      .from('locations')
      .insert({ name: locationName, address: locationAddress || null, url: locationUrl || null })
      .select('id')
      .single();
    locationId = (loc as any)?.id || null;
  }
  if (!locationId) {
    throw new Error('Location is required. Select an existing location or create a new one.');
  }

  const payload: any = {
    name_en: name_en || null,
    name_ja: name_ja || null,
    event_date: eventDate || null,
    start_time: startTime || null,
    visibility: ['open','members','closed'].includes(visibility) ? visibility : 'open',
    notes: notes || null,
    location_id: locationId,
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
          <legend className="text-sm font-medium">Location</legend>
          <div className="grid gap-3">
            <SearchSelect name="location_id" label="Select existing location" searchPath="/api/search/locations" labelFields={["name","local_number","address"]} valueKey="id" />
            <div className="text-xs text-gray-600">Or create a new location:</div>
            <input name="location_name" className="input w-full" placeholder="Name" />
            <input name="location_address" className="input w-full" placeholder="Address" />
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


