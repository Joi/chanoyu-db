import { redirect, notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Image from 'next/image';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import dynamic from 'next/dynamic';
import { mintToken } from '@/lib/id';
import SubmitButton from '@/app/components/SubmitButton';
import PendingProgress from '@/app/components/PendingProgress';
import { z } from 'zod';

type MediaRow = { id: string; token: string | null; uri: string | null; kind: string | null; local_number: string | null };
type LocationRow = {
  id: string;
  name: string | null;
  name_en: string | null;
  name_ja: string | null;
  address: string | null;
  address_en: string | null;
  address_ja: string | null;
  url: string | null;
  local_number: string | null;
  visibility: string | null;
  lat: number | null;
  lng: number | null;
  google_place_id: string | null;
  google_maps_url: string | null;
  contained_in: string | null;
  contained_in_en: string | null;
  contained_in_ja: string | null;
};

async function addMediaUrlAction(formData: FormData) {
  'use server';
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const parse = z
    .object({
      location_id: z.string().min(1),
      image_url: z.string().url().min(1).max(2048),
    })
    .safeParse({
      location_id: String(formData.get('location_id') || ''),
      image_url: String(formData.get('image_url') || '').trim(),
    });
  if (!parse.success) return;
  const { location_id: locationId, image_url: url } = parse.data;
  const db = supabaseAdmin();
  const token = mintToken();
  const { data: media, error: eIns } = await db
    .from('media')
    .insert({ uri: url, kind: 'image', sort_order: 999, token })
    .select('id')
    .single();
  if (eIns || !media) throw eIns;
  await db.from('location_media_links').upsert({ location_id: locationId, media_id: media.id });
  revalidatePath(`/admin/tea-rooms/${locationId}`);
}

async function uploadMediaFileAction(formData: FormData) {
  'use server';
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const locationId = String(formData.get('location_id') || '');
  const file = formData.get('file') as File | null;
  if (!locationId || !file) return;
  const db = supabaseAdmin();
  // Ensure bucket exists (do not auto-create in production)
  try {
    const b = await (db as any).storage.getBucket('media');
    const exists = b && !b.error && b.data != null;
    if (!exists) throw new Error('media bucket missing');
  } catch (e: any) {
    throw new Error('media bucket missing');
  }
  const arrayBuffer = await file.arrayBuffer();
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const filename = `${mintToken(6)}.${ext}`;
  // Store alongside other entities at a uniform level: media/<entityId>/<filename>
  const path = `media/${locationId}/${filename}`;
  // @ts-ignore
  const body: any = typeof Buffer !== 'undefined' ? Buffer.from(arrayBuffer) : arrayBuffer;
  // @ts-ignore
  const upload = await (db as any).storage.from('media').upload(path, body, { contentType: file.type || 'application/octet-stream', upsert: false });
  if (upload.error) throw upload.error;
  // @ts-ignore
  const pub = (db as any).storage.from('media').getPublicUrl(path);
  const uri = pub?.data?.publicUrl as string | undefined;
  if (!uri) throw new Error('public url missing');
  const token = mintToken();
  const { data: media } = await db
    .from('media')
    .insert({ uri, kind: 'image', sort_order: 999, token })
    .select('id')
    .single();
  if (media?.id) {
    await db.from('location_media_links').upsert({ location_id: locationId, media_id: media.id });
  }
  revalidatePath(`/admin/tea-rooms/${locationId}`);
}

async function linkExistingMediaAction(formData: FormData) {
  'use server';
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const locationId = String(formData.get('location_id') || '');
  const mediaRef = String(formData.get('media_ref') || '').trim();
  if (!locationId || !mediaRef) return;
  const db = supabaseAdmin();
  let mediaId: string | null = null;
  if (/^[0-9a-fA-F-]{36}$/.test(mediaRef)) {
    mediaId = mediaRef;
  } else {
    const { data: byLocal } = await db.from('media').select('id').ilike('local_number', mediaRef).maybeSingle();
    mediaId = byLocal?.id || null;
  }
  if (!mediaId) return;
  await db.from('location_media_links').upsert({ location_id: locationId, media_id: mediaId });
  revalidatePath(`/admin/tea-rooms/${locationId}`);
}

async function unlinkMediaAction(formData: FormData) {
  'use server';
  const ok = await requireAdmin();
  if (!ok) return redirect('/login');
  const locationId = String(formData.get('location_id') || '');
  const mediaId = String(formData.get('media_id') || '');
  if (!locationId || !mediaId) return;
  const db = supabaseAdmin();
  await db.from('location_media_links').delete().eq('location_id', locationId).eq('media_id', mediaId);
  revalidatePath(`/admin/tea-rooms/${locationId}`);
}
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
  const GoogleMapSearchPicker = dynamic(() => import('@/app/components/GoogleMapSearchPicker'), {
    ssr: false,
    loading: () => <div className="border rounded h-40 bg-gray-50" />,
  });
  const db = supabaseAdmin();
  const { data: loc } = await db
    .from('locations')
    .select('id, name, name_en, name_ja, address, address_en, address_ja, url, local_number, visibility, lat, lng, google_place_id, google_maps_url, contained_in, contained_in_en, contained_in_ja')
    .eq('id', params.id)
    .maybeSingle();
  if (!loc) return notFound();

  // Fetch linked media via location_media_links
  const { data: linkRows } = await db
    .from('location_media_links')
    .select('media_id')
    .eq('location_id', loc.id);
  const mediaIds = Array.from(new Set((linkRows || []).map((r) => r.media_id).filter(Boolean)));
  let media: MediaRow[] = [];
  if (mediaIds.length) {
    const { data: m } = await db
      .from('media')
      .select('id, token, uri, kind, local_number')
      .in('id', mediaIds);
    media = m || [];
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Edit Tea Room</h1>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
      <section>
      <h2 className="text-lg font-semibold mb-2">Images</h2>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {media.map((m) => (
          <div key={m.id} className="card">
            <div className="relative w-full" style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', background: '#f8f8f8', borderRadius: 6, overflow: 'hidden', border: '1px solid #eee' }}>
              <a href={`/media/${m.token || m.id}`}>
                <Image src={m.uri || ''} alt={loc.name_en || loc.name_ja || loc.name || 'Image'} fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: 'cover' }} />
              </a>
            </div>
            <div className="mt-2 text-sm">
              <a className="underline" href={`/media/${m.token || m.id}`}>Open media page</a> {m.local_number ? <span> · {m.local_number}</span> : null}
            </div>
            <form action={unlinkMediaAction} className="mt-2">
              <input type="hidden" name="location_id" value={loc.id} />
              <input type="hidden" name="media_id" value={m.id} />
              <button type="submit" className="text-red-600 text-sm">Unlink</button>
            </form>
          </div>
        ))}
      </div>
      <div className="mt-4 card">
        <form action={addMediaUrlAction} className="space-y-2">
          <input type="hidden" name="location_id" value={loc.id} />
          <label className="label">Add image by URL (public)</label>
          <input name="image_url" className="input" placeholder="https://..." />
          <SubmitButton label="Add" pendingLabel="Adding..." />
        </form>
        <form action={uploadMediaFileAction} className="space-y-2" style={{ marginTop: 12 }}>
          <input type="hidden" name="location_id" value={loc.id} />
          <label className="label">Or upload image</label>
          <div className="flex items-center gap-2">
            <label htmlFor={`file-upload-${loc.id}`} className="button file-choose small">Choose file</label>
            <input id={`file-upload-${loc.id}`} name="file" type="file" accept="image/*" className="sr-only" />
            <span className="text-xs text-gray-600">Select an image, then click Upload</span>
          </div>
          <PendingProgress className="mt-1" />
          <SubmitButton label="Upload" pendingLabel="Uploading..." />
        </form>
        <form action={linkExistingMediaAction} className="space-y-2" style={{ marginTop: 12 }}>
          <input type="hidden" name="location_id" value={loc.id} />
          <label className="label">Link existing media by ID or local number</label>
          <input name="media_ref" className="input" placeholder="UUID or local number" />
          <SubmitButton label="Link" pendingLabel="Linking..." />
        </form>
      </div>
      </section>

      <section>
      <form action={updateTeaRoom} className="grid gap-3">
        <input type="hidden" name="id" value={loc.id} />
        <div>
          <label className="block text-sm font-medium">Name (EN)</label>
          <input name="name_en" className="input w-full" defaultValue={loc.name_en || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium">Name (JA)</label>
          <input name="name_ja" className="input w-full" defaultValue={loc.name_ja || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium">Address (EN)</label>
          <input name="address_en" className="input w-full" defaultValue={loc.address_en || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium">Address (JA)</label>
          <input name="address_ja" className="input w-full" defaultValue={loc.address_ja || ''} />
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
          defaultQuery={loc.name_en || loc.name_ja || loc.name || ''}
          defaultLat={loc.lat ?? null}
          defaultLng={loc.lng ?? null}
          defaultPlaceId={loc.google_place_id ?? null}
          defaultMapsUrl={loc.google_maps_url ?? null}
        />
        <div>
          <label className="block text-sm font-medium">Contained in (EN)</label>
          <input name="contained_in_en" className="input w-full" defaultValue={loc.contained_in_en || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium">Contained in (JA)</label>
          <input name="contained_in_ja" className="input w-full" defaultValue={loc.contained_in_ja || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium">Visibility</label>
          <select name="visibility" className="input w-full" defaultValue={loc.visibility}>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div className="flex gap-3 mt-2">
          <SubmitButton label="Save" pendingLabel="Saving..." />
          <a className="button secondary" href="/admin/tea-rooms">Cancel</a>
        </div>
      </form>
      <form action={deleteTeaRoom} className="mt-6">
        <input type="hidden" name="id" value={loc.id} />
        <button className="text-sm text-red-600 underline" type="submit">Delete Tea Room</button>
      </form>
      </section>
      </div>
    </main>
  );
}


