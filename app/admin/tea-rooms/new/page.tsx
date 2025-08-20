import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import GoogleMapSearchPicker from '@/app/components/GoogleMapSearchPicker';

async function createTeaRoom(formData: FormData) {
  'use server';
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
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
  const suggestedName = String(formData.get('location_suggested_name') || '').trim();
  const suggestedAddress = String(formData.get('location_suggested_address') || '').trim();
  const queryText = String(formData.get('location_query') || '').trim();
  const containedInEn = String(formData.get('contained_in_en') || '').trim();
  const containedInJa = String(formData.get('contained_in_ja') || '').trim();
  const effectiveName = nameEn || nameJa || suggestedName || queryText;
  const effectiveAddress = addressEn || addressJa || suggestedAddress || queryText;
  if (!effectiveName) throw new Error('Name (EN or JA) is required');
  const db = supabaseAdmin();
  const { error } = await db
    .from('locations')
    .insert({
      name: effectiveName,
      name_en: nameEn || null,
      name_ja: nameJa || null,
      address: effectiveAddress || null,
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
    });
  if (error) throw error;
  revalidatePath('/admin/tea-rooms');
  return redirect('/admin/tea-rooms');
}

export default async function NewTeaRoomPage() {
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Add Tea Room</h1>
      <form action={createTeaRoom} className="grid gap-3">
        <div>
          <label className="block text-sm font-medium">Name (EN)</label>
          <input name="name_en" className="input w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Name (JA)</label>
          <input name="name_ja" className="input w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Address (EN)</label>
          <input name="address_en" className="input w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Address (JA)</label>
          <input name="address_ja" className="input w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Website URL</label>
          <input name="url" className="input w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Local Number</label>
          <input name="local_number" className="input w-full" placeholder="ITO-L-YYYY-NNNNN" />
        </div>
        <GoogleMapSearchPicker namePrefix="location" />
        <div>
          <label className="block text-sm font-medium">Contained in (EN)</label>
          <input name="contained_in_en" className="input w-full" placeholder="e.g., Museum name, Building name" />
        </div>
        <div>
          <label className="block text-sm font-medium">Contained in (JA)</label>
          <input name="contained_in_ja" className="input w-full" placeholder="例：施設名、建物名" />
        </div>
        <div>
          <label className="block text-sm font-medium">Visibility</label>
          <select name="visibility" className="input w-full" defaultValue="public">
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div className="flex gap-3 mt-2">
          <button className="button" type="submit">Create</button>
          <a className="button secondary" href="/admin/tea-rooms">Cancel</a>
        </div>
      </form>
    </main>
  );
}


