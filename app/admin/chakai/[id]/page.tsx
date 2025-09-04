import { redirect, notFound } from 'next/navigation';
import Image from 'next/image';
import { supabaseAdmin } from '@/lib/supabase/server';
import SearchSelect from '@/app/components/SearchSelect';
import { requireAdmin } from '@/lib/auth';
import { mintToken } from '@/lib/id';
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
  const { name_en, name_ja, event_date, start_time, visibility, notes, location_id, location_name_en, location_name_ja, location_address_en, location_address_ja, location_url, attendee_ids, item_ids } = parsed.data as any;
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
  payload.location_id = locationId;

  await db.from('chakai').update(payload).eq('id', id);
  // Replace attendees/items
  const attendeeIds = String(attendee_ids || '').split(',').map((s) => s.trim()).filter(Boolean);
  const itemIds = String(item_ids || '').split(',').map((s) => s.trim()).filter(Boolean);
  
  // Use a transaction for consistency
  const client = db; // supabase-js does not expose explicit tx; rely on sequential operations
  
  // Delete existing attendees
  const delAtt = await client.from('chakai_attendees').delete().eq('chakai_id', id);
  if (delAtt.error) throw delAtt.error;
  
  // Insert new attendees
  if (attendeeIds.length) {
    const attendeeData = attendeeIds.map((aid) => ({ chakai_id: id, account_id: aid }));
    const insAtt = await client.from('chakai_attendees').insert(attendeeData);
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

async function removeChakaiItem(formData: FormData) {
  'use server';
  const ok = await requireAdmin();
  if (!ok) return notFound();
  const chakaiId = String(formData.get('id') || ''); // Get from main form's id field
  const objectId = String(formData.get('object_id') || '');
  if (!chakaiId || !objectId) return notFound();
  const db = supabaseAdmin();
  await db.from('chakai_items').delete().eq('chakai_id', chakaiId).eq('object_id', objectId);
  return redirect(`/admin/chakai/${chakaiId}`);
}

export default async function EditChakai({ params }: { params: { id: string } }) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return redirect('/login');
  const db = supabaseAdmin();
  const { data: c } = await db
    .from('chakai')
    .select('id, token, name_en, name_ja, event_date, start_time, visibility, notes, location_id')
    .eq('id', params.id)
    .maybeSingle();
  if (!c) return notFound();

  const { data: attendeeRows } = await db
    .from('chakai_attendees')
    .select('accounts(id, full_name_en, full_name_ja, email)')
    .eq('chakai_id', c.id);
  const attendees = (attendeeRows || []).map((r: any) => ({ value: r.accounts.id, label: r.accounts.full_name_en || r.accounts.full_name_ja || r.accounts.email }));

  const { data: itemRows, error: itemError } = await db
    .from('chakai_items')
    .select('objects(id, token, title, title_ja, local_number)')
    .eq('chakai_id', c.id);
  
  console.log('[EditChakai] Items query result:', { itemRows, itemError, chakaiId: c.id });
  
  const itemObjects: any[] = (itemRows || []).map((r: any) => r.objects);
  const items = itemObjects.map((o: any) => ({ value: o.id, label: o.title || o.title_ja || o.local_number || o.token }));
  
  console.log('[EditChakai] Processed items:', { itemObjects, items });

  // Thumbnails for selected items (primary image = lowest sort_order)
  let thumbByObject: Record<string, string | null> = {};
  if (itemObjects.length) {
    const ids = itemObjects.map((o: any) => o.id);
    const { data: mediaRows } = await db
      .from('media')
      .select('object_id, uri, sort_order')
      .in('object_id', ids);
    const sorted = (mediaRows || []).sort((a: any, b: any) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
    for (const m of sorted) {
      const oid = (m as any).object_id as string;
      if (!thumbByObject[oid]) thumbByObject[oid] = (m as any).uri || null;
    }
  }

  const date = c.event_date ? new Date(c.event_date).toISOString().slice(0, 10) : '';
  const time = c.start_time ? String(c.start_time).slice(0, 5) : '';

  // For initial location display
  const { data: loc } = c.location_id
    ? await db.from('locations').select('id, name, name_en, name_ja, address, address_en, address_ja, local_number, visibility, lat, lng, google_maps_url').eq('id', c.location_id).maybeSingle()
    : { data: null } as any;

  // For dropdown list of tea rooms
  const { data: rooms } = await db
    .from('locations')
    .select('id, name, name_en, name_ja, local_number')
    .order('name', { ascending: true })
    .limit(1000);

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
          <legend className="text-sm font-medium">Tea Room</legend>
          <div className="grid gap-3">
            <div className="grid gap-1">
              <label className="text-sm">Select tea room</label>
              <select name="location_id" className="input w-full" defaultValue={c.location_id || ''}>
                <option value="">— Select —</option>
                {(rooms || []).map((r: any) => {
                  const title = r.name_ja || r.name_en || r.name || '';
                  const en = r.name_en || r.name || '';
                  const label = en && r.name_ja ? `${title} / ${en}` : title;
                  return <option key={r.id} value={r.id}>{label}{r.local_number ? ` (${r.local_number})` : ''}</option>;
                })}
              </select>
              <div className="text-xs">
                <a className="underline" href="/admin/tea-rooms/new" target="_blank" rel="noreferrer">Add a new tea room</a>
              </div>
            </div>

            {loc ? (
              <div className="card grid gap-1">
                <div className="text-sm font-medium">
                  {((loc as any).name_ja || (loc as any).name_en || (loc as any).name) || '(unnamed)'}
                  {((loc as any).name_ja && ((loc as any).name_en || (loc as any).name)) ? <span className="text-xs text-gray-700 ml-2" lang="en">/ {(loc as any).name_en || (loc as any).name}</span> : null}
                  {(loc as any).local_number ? ` (${(loc as any).local_number})` : ''}
                  {` · ${(loc as any).visibility}`}
                </div>
                <div className="text-xs text-gray-700">
                  {(loc as any).address_en || (loc as any).address || '—'}{(loc as any).address_ja ? <span lang="ja"> / {(loc as any).address_ja}</span> : null}
                </div>
                {((loc as any).lat != null && (loc as any).lng != null) ? (
                  <iframe
                    title="Map"
                    className="w-full h-40 rounded border"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(String((loc as any).lat)+','+String((loc as any).lng))}&hl=en&z=18&output=embed`}
                  />
                ) : null}
                {(loc as any).google_maps_url ? <a className="text-xs underline" href={(loc as any).google_maps_url} target="_blank" rel="noreferrer">Open in Google Maps</a> : null}
              </div>
            ) : null}
          </div>
        </fieldset>
        <section className="grid gap-3">
          <h2 className="font-medium">Attendees</h2>
          <SearchSelect name="attendee_ids" label="Attendees" searchPath="/api/search/accounts" labelFields={["full_name_en","full_name_ja","email"]} valueKey="id" initial={attendees} />
        </section>
        <section className="grid gap-3">
          <h2 className="font-medium">Items used</h2>
          <SearchSelect name="item_ids" label="Add items" searchPath="/api/search/objects" labelFields={["title","title_ja","local_number","token"]} valueKey="id" initial={items} />
          {itemObjects.length ? (
            <div className="grid" style={{ gap: 8 }}>
              {itemObjects.map((o: any) => {
                const ja = o.title_ja || '';
                const en = o.title || '';
                const label = ja || en || o.local_number || o.token;
                const secondary = ja && en ? en : '';
                const thumb = thumbByObject[o.id] || null;
                return (
                  <div key={o.id} className="card" style={{ display: 'grid', gridTemplateColumns: '64px 1fr auto', alignItems: 'center', gap: 8 }}>
                    <div style={{ position: 'relative', width: 64, height: 64, background: '#f5f5f5', borderRadius: 6, overflow: 'hidden' }}>
                      {thumb ? <Image src={thumb} alt={label} fill sizes="64px" style={{ objectFit: 'cover' }} /> : null}
                    </div>
                    <div className="text-sm">
                      <div>{label}{secondary ? <span className="text-xs text-gray-700 ml-2" lang="en">/ {secondary}</span> : null}{o.local_number ? ` (${o.local_number})` : ''}</div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <a className="text-xs underline" href={`/admin/${o.token}`}>Edit item</a>
                      <button 
                        formAction={removeChakaiItem}
                        name="object_id" 
                        value={o.id}
                        className="text-xs underline text-red-600 bg-transparent border-none p-0 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
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
