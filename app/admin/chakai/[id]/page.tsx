import { redirect, notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import SearchSelect from '@/app/components/SearchSelect';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';
import { updateChakaiSchema } from '@/lib/chakai';

async function updateChakai(formData: FormData) {
  'use server';
  const isAdmin = await requireAdmin();
  if (!isAdmin) return redirect('/login');
  const id = String(formData.get('id') || '');
  if (!id) return notFound();
  const db = supabaseAdmin();
  const parsed = updateChakaiSchema.safeParse(Object.fromEntries(formData as any));
  if (!parsed.success) {
    const first = parsed.error.issues?.[0];
    const msg = first ? `${first.path.join('.')}: ${first.message}` : 'Invalid input.';
    throw new Error(`Invalid input. ${msg}`);
  }
  const { name_en, name_ja, event_date, start_time, visibility, notes, location_id, location_name, location_address, location_url, attendee_ids, item_ids } = parsed.data as any;
  const payload: any = {
    name_en: name_en || null,
    name_ja: name_ja || null,
    event_date,
    start_time: start_time || null,
    visibility,
    notes: notes || null,
  };
  // Handle location select-or-create
  let locationId: string | null = (location_id as string) || null;
  if (!locationId && location_name) {
    const { data: loc } = await db
      .from('locations')
      .insert({ name: location_name, address: location_address || null, url: location_url || null })
      .select('id')
      .single();
    locationId = (loc as any)?.id || null;
  }
  payload.location_id = locationId;

  await db.from('chakai').update(payload).eq('id', id);
  // Replace attendees/items
  const attendeeIds = String(attendee_ids || '').split(',').map((s) => s.trim()).filter(Boolean);
  const itemIds = String(item_ids || '').split(',').map((s) => s.trim()).filter(Boolean);
  // Use a transaction for consistency
  const client = db; // supabase-js does not expose explicit tx; rely on sequential operations
  const delAtt = await client.from('chakai_attendees').delete().eq('chakai_id', id);
  if (delAtt.error) throw delAtt.error;
  if (attendeeIds.length) {
    const insAtt = await client.from('chakai_attendees').insert(attendeeIds.map((aid) => ({ chakai_id: id, account_id: aid })));
    if (insAtt.error) throw insAtt.error;
  }
  const delItems = await client.from('chakai_items').delete().eq('chakai_id', id);
  if (delItems.error) throw delItems.error;
  if (itemIds.length) {
    const insItems = await client.from('chakai_items').insert(itemIds.map((oid) => ({ chakai_id: id, object_id: oid })));
    if (insItems.error) throw insItems.error;
  }
  return redirect(`/chakai/${id}`);
}

async function deleteChakai(formData: FormData) {
  'use server';
  const ok = await requireAdmin();
  if (!ok) return notFound();
  const id = String(formData.get('id') || '');
  if (!id) return notFound();
  const db = supabaseAdmin();
  await db.from('chakai').delete().eq('id', id);
  return redirect('/admin/chakai');
}

export default async function EditChakai({ params }: { params: { id: string } }) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return redirect('/login');
  const db = supabaseAdmin();
  const { data: c } = await db
    .from('chakai')
    .select('id, name_en, name_ja, event_date, start_time, visibility, notes, location_id')
    .eq('id', params.id)
    .maybeSingle();
  if (!c) return notFound();

  const { data: attendeeRows } = await db
    .from('chakai_attendees')
    .select('accounts(id, full_name_en, full_name_ja, email)')
    .eq('chakai_id', c.id);
  const attendees = (attendeeRows || []).map((r: any) => ({ value: r.accounts.id, label: r.accounts.full_name_en || r.accounts.full_name_ja || r.accounts.email }));

  const { data: itemRows } = await db
    .from('chakai_items')
    .select('objects(id, token, title, title_ja, local_number)')
    .eq('chakai_id', c.id);
  const items = (itemRows || []).map((r: any) => ({ value: r.objects.id, label: r.objects.title || r.objects.title_ja || r.objects.local_number || r.objects.token }));

  const date = c.event_date ? new Date(c.event_date).toISOString().slice(0, 10) : '';
  const time = c.start_time ? String(c.start_time).slice(0, 5) : '';

  // For initial location display
  const { data: loc } = c.location_id
    ? await db.from('locations').select('id, name, address, local_number').eq('id', c.location_id).maybeSingle()
    : { data: null } as any;

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Edit Chakai</h1>
      <form action={updateChakai} className="grid gap-3">
        <input type="hidden" name="id" value={c.id} />
        <div>
          <label className="block text-sm font-medium">Name (EN)</label>
          <input name="name_en" className="input w-full" defaultValue={c.name_en || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium">Name (JA)</label>
          <input name="name_ja" className="input w-full" defaultValue={c.name_ja || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium">Date</label>
          <input type="date" name="event_date" className="input w-full" defaultValue={date} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Start time</label>
          <input type="time" name="start_time" className="input w-full" defaultValue={time} />
        </div>
        <div>
          <label className="block text-sm font-medium">Visibility</label>
          <select name="visibility" className="input w-full" defaultValue={c.visibility}>
            <option value="open">Open</option>
            <option value="members">Members</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Notes</label>
          <textarea name="notes" className="input w-full" rows={3} defaultValue={c.notes || ''} />
        </div>
        <fieldset className="border p-3 rounded">
          <legend className="text-sm font-medium">Location</legend>
          <div className="grid gap-3">
            <SearchSelect name="location_id" label="Select existing location" searchPath="/api/search/locations" labelFields={["name","local_number","address"]} valueKey="id" initial={loc ? [{ value: loc.id, label: `${loc.name}${loc.local_number ? ` (${loc.local_number})` : ''}` }] : []} />
            <div className="text-xs text-gray-600">Or create a new location:</div>
            <input name="location_name" className="input w-full" placeholder="Name" />
            <input name="location_address" className="input w-full" placeholder="Address" />
            <input name="location_url" className="input w-full" placeholder="URL" />
          </div>
        </fieldset>
        <section className="grid gap-3">
          <h2 className="font-medium">Attendees</h2>
          <SearchSelect name="attendee_ids" label="Attendees" searchPath="/api/search/accounts" labelFields={["full_name_en","full_name_ja","email"]} valueKey="id" initial={attendees} />
        </section>
        <section className="grid gap-3">
          <h2 className="font-medium">Items used</h2>
          <SearchSelect name="item_ids" label="Items used" searchPath="/api/search/objects" labelFields={["title","title_ja","local_number","token"]} valueKey="id" initial={items} />
        </section>
        <div className="flex gap-3 mt-2">
          <button className="button" type="submit">Save</button>
          <a className="button secondary" href={`/chakai/${c.id}`}>Cancel</a>
        </div>
      </form>
      <form action={deleteChakai} className="mt-6">
        <input type="hidden" name="id" value={c.id} />
        <button className="text-sm text-red-600 underline" type="submit">Delete Chakai</button>
      </form>
    </main>
  );
}
