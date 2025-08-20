import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { currentUserEmail, requireAdmin, requireOwner } from '@/lib/auth';
import Image from 'next/image';

export default async function TeaRoomDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const db = supabaseAdmin();
  const email = await currentUserEmail();
  const isPrivileged = await requireAdmin();
  const isOwner = await requireOwner();

  const { data: loc, error } = await db
    .from('locations')
    .select('id, name, name_en, name_ja, address, address_en, address_ja, url, local_number, visibility, contained_in, contained_in_en, contained_in_ja, lat, lng, google_maps_url')
    .eq('id', id)
    .maybeSingle();
  if (error) console.error('[tea-room detail] query error', error.message || error);
  if (!loc) return notFound();
  // Fetch linked images
  const { data: linkRows } = await db
    .from('location_media_links')
    .select('media_id')
    .eq('location_id', (loc as any).id);
  const mediaIds = Array.from(new Set((linkRows || []).map((r: any) => r.media_id).filter(Boolean)));
  let media: any[] = [];
  if (mediaIds.length) {
    const { data: rows } = await db
      .from('media')
      .select('id, uri, kind, sort_order')
      .in('id', mediaIds);
    media = (rows || []).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }

  if (!isPrivileged && loc.visibility === 'private') {
    if (!email) return notFound();
    const { data: attended } = await db
      .from('chakai_attendees')
      .select('chakai_id, accounts!inner(email), chakai:chakai!inner(location_id)')
      .eq('accounts.email', email)
      .eq('chakai.location_id', loc.id);
    if (!attended || !attended.length) return notFound();
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-2">
        {(() => {
          const titleEn = (loc as any).name_en || (loc as any).name || '';
          const titleJa = (loc as any).name_ja || '';
          const primary = titleJa || titleEn || (loc as any).name || '';
          return (
            <h1 className="text-xl font-semibold">
              {primary}
              {titleEn && titleJa ? <span className="text-sm text-gray-700 ml-2" lang="en">/ {titleEn}</span> : null}
              {loc.local_number ? ` (${loc.local_number})` : ''}
            </h1>
          );
        })()}
      </div>
      {(() => {
        const addrEn = (loc as any).address_en || (loc as any).address || '';
        const addrJa = (loc as any).address_ja || '';
        return (
          <div className="text-sm text-gray-700 mb-4">
            {addrEn || '—'}
            {addrJa ? <span lang="ja"> / {addrJa}</span> : null}
            {loc.url ? ` · ${loc.url}` : ''}
            {loc.local_number ? ` · ${loc.local_number}` : ''}
          </div>
        );
      })()}

      {media.length ? (
        <div className="grid mb-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {media.map((m: any) => (
            <div key={m.id} className="relative" style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', background: '#f8f8f8', borderRadius: 6, overflow: 'hidden', border: '1px solid #eee' }}>
              <a href={m.uri} target="_blank" rel="noreferrer">
                <Image src={m.uri} alt={(loc as any).name || 'Image'} fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: 'cover' }} />
              </a>
            </div>
          ))}
        </div>
      ) : null}
      {(() => {
        const ciEn = (loc as any).contained_in_en || (loc as any).contained_in || '';
        const ciJa = (loc as any).contained_in_ja || '';
        if (!(ciEn || ciJa)) return null;
        return (
          <div className="text-sm text-gray-700 mb-4">
            Contained in: {ciEn || '—'}{ciJa ? <span lang="ja"> / {ciJa}</span> : null}
          </div>
        );
      })()}
      {(loc as any).lat != null && (loc as any).lng != null ? (
        <iframe
          title="Map"
          className="w-full h-80 rounded border mb-6"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps?q=${encodeURIComponent(String((loc as any).lat)+','+String((loc as any).lng))}&hl=en&z=18&output=embed`}
        />
      ) : null}
      <div className="flex items-center gap-4">
        {loc.url ? <a className="text-sm underline" href={loc.url} target="_blank" rel="noreferrer">Website</a> : null}
        {(loc as any).google_maps_url ? <a className="text-sm underline" href={(loc as any).google_maps_url} target="_blank" rel="noreferrer">Google Map</a> : null}
      </div>
    </main>
  );
}


