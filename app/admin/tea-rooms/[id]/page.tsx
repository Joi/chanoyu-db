import { redirect, notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import GoogleMapSearchPicker from '@/app/components/GoogleMapSearchPicker';

async function updateTeaRoom(formData: FormData) {
  'use server';
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const id = String(formData.get('id') || '');
  if (!id) return notFound();
  const nameEn = String(formData.get('name_en') || '').trim();
  const nameJa = String(formData.get('name_ja') || '').trim();
  const addressEn = String(formData.get('address_en') || '').trim();
  const addressJa = String(formData.get('address_ja') || '').trim();
  const url = String(formData.get('url') || '').trim();
  const visibility = String(formData.get('visibility') || 'public');
  const localNumber = String(formData.get('local_number') || '').trim();
  const latRaw = String(formData.get('location_lat') || '').trim();
  const lngRaw = String(formData.get('location_lng') || '').trim();
  const placeId = String(formData.get('location_google_place_id') || '').trim();
  const mapsUrl = String(formData.get('location_google_maps_url') || '').trim();
  const containedInEn = String(formData.get('contained_in_en') || '').trim();
  const containedInJa = String(formData.get('contained_in_ja') || '').trim();
  const db = supabaseAdmin();
  const { error } = await db
    .from('locations')
    .update({
      name: nameEn || nameJa,
      name_en: nameEn || null,
      name_ja: nameJa || null,
      address: addressEn || addressJa || null,
      address_en: addressEn || null,
      address_ja: addressJa || null,
      url: url || null,
      visibility,
      local_number: localNumber || null,
      lat: latRaw ? Number(latRaw) : null,
      lng: lngRaw ? Number(lngRaw) : null,
      google_place_id: placeId || null,
      google_maps_url: mapsUrl || null,
      contained_in: containedInEn || containedInJa || null,
      contained_in_en: containedInEn || null,
      contained_in_ja: containedInJa || null,
    })
    .eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/tea-rooms');
  return redirect('/admin/tea-rooms');
}

async function deleteTeaRoom(formData: FormData) {
  'use server';
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const id = String(formData.get('id') || '');
  if (!id) return notFound();
  const db = supabaseAdmin();
  await db.from('locations').delete().eq('id', id);
  revalidatePath('/admin/tea-rooms');
  return redirect('/admin/tea-rooms');
}

export default async function EditTeaRoomPage({ params }: { params: { id: string } }) {
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const db = supabaseAdmin();
  const { data: loc } = await db
    .from('locations')
    .select('id, name, name_en, name_ja, address, address_en, address_ja, url, local_number, visibility, lat, lng, google_place_id, google_maps_url, contained_in, contained_in_en, contained_in_ja')
    .eq('id', params.id)
    .maybeSingle();
  if (!loc) return notFound();

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Edit Tea Room</h1>
      <form action={updateTeaRoom} className="grid gap-3">
        <input type="hidden" name="id" value={loc.id} />
        <div>
          <label className="block text-sm font-medium">Name (EN)</label>
          <input name="name_en" className="input w-full" defaultValue={(loc as any).name_en || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium">Name (JA)</label>
          <input name="name_ja" className="input w-full" defaultValue={(loc as any).name_ja || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium">Address (EN)</label>
          <input name="address_en" className="input w-full" defaultValue={(loc as any).address_en || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium">Address (JA)</label>
          <input name="address_ja" className="input w-full" defaultValue={(loc as any).address_ja || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium">Website URL</label>
          <input name="url" className="input w-full" defaultValue={loc.url || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium">Local Number</label>
          <input name="local_number" className="input w-full" defaultValue={loc.local_number || ''} />
        </div>
        <GoogleMapSearchPicker
          namePrefix="location"
          defaultQuery={(loc as any).name_en || (loc as any).name_ja || (loc as any).name || ''}
          defaultLat={(loc as any).lat ?? null}
          defaultLng={(loc as any).lng ?? null}
          defaultPlaceId={(loc as any).google_place_id ?? null}
        />
        <div>
          <label className="block text-sm font-medium">Contained in (EN)</label>
          <input name="contained_in_en" className="input w-full" defaultValue={(loc as any).contained_in_en || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium">Contained in (JA)</label>
          <input name="contained_in_ja" className="input w-full" defaultValue={(loc as any).contained_in_ja || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium">Visibility</label>
          <select name="visibility" className="input w-full" defaultValue={loc.visibility}>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div className="flex gap-3 mt-2">
          <button className="button" type="submit">Save</button>
          <a className="button secondary" href="/admin/tea-rooms">Cancel</a>
        </div>
      </form>
      <form action={deleteTeaRoom} className="mt-6">
        <input type="hidden" name="id" value={loc.id} />
        <button className="text-sm text-red-600 underline" type="submit">Delete Tea Room</button>
      </form>
    </main>
  );
}


