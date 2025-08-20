import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { currentUserEmail, requireAdmin, requireOwner } from '@/lib/auth';

export default async function TeaRoomDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const db = supabaseAdmin();
  const email = await currentUserEmail();
  const isPrivileged = await requireAdmin();
  const isOwner = await requireOwner();

  const { data: loc, error } = await db
    .from('locations')
    .select('id, name, name_en, name_ja, address, address_en, address_ja, url, local_number, visibility')
    .eq('id', id)
    .maybeSingle();
  if (error) console.error('[tea-room detail] query error', error.message || error);
  if (!loc) return notFound();

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
        <h1 className="text-xl font-semibold">{(loc as any).name_en || (loc as any).name_ja || (loc as any).name}{loc.local_number ? ` (${loc.local_number})` : ''}</h1>
      </div>
      <div className="text-sm text-gray-700 mb-4">{(loc as any).address_en || (loc as any).address_ja || (loc as any).address || '—'}{loc.url ? ` · ${loc.url}` : ''}{loc.local_number ? ` · ${loc.local_number}` : ''}</div>
      {(loc as any).contained_in_en || (loc as any).contained_in_ja || (loc as any).contained_in ? (
        <div className="text-sm text-gray-700 mb-4">Contained in: {(loc as any).contained_in_en || (loc as any).contained_in_ja || (loc as any).contained_in}</div>
      ) : null}
      {(loc as any).lat != null && (loc as any).lng != null ? (
        <iframe
          title="Map"
          className="w-full h-80 rounded border mb-6"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps?q=${encodeURIComponent(String((loc as any).lat)+','+String((loc as any).lng))}&hl=en&z=15&output=embed`}
        />
      ) : null}
      {loc.url ? <a className="text-sm underline" href={loc.url} target="_blank" rel="noreferrer">Website</a> : null}
    </main>
  );
}


