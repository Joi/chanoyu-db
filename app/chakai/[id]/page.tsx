import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { currentUserEmail, requireAdmin, requireOwner } from '@/lib/auth';
import Link from 'next/link';
import Image from 'next/image';

export default async function ChakaiDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const db = supabaseAdmin();
  const email = await currentUserEmail();
  const isPrivileged = await requireAdmin();
  const isOwner = await requireOwner();

  const { data: c, error } = await db
    .from('chakai')
    .select('id, name_en, name_ja, local_number, event_date, start_time, visibility, notes, location_id')
    .eq('id', id)
    .maybeSingle();
  if (error) console.error('[chakai detail] query error', error.message || error);
  if (!c) return notFound();

  // Visibility gate (RLS is also enabled)
  if (!isPrivileged) {
    if (c.visibility === 'closed') return notFound();
    if (c.visibility === 'members') {
      if (!email) return notFound();
      const { data: rows } = await db
        .from('chakai_attendees')
        .select('chakai_id, accounts!inner(email)')
        .eq('chakai_id', c.id)
        .eq('accounts.email', email);
      if (!rows || !rows.length) return notFound();
    }
  }

  const { data: loc } = c.location_id
    ? await db.from('locations').select('id, name, name_en, name_ja, address, address_en, address_ja, url, local_number, visibility').eq('id', c.location_id).maybeSingle()
    : { data: null } as any;

  let canShowTeaRoom = false;
  if (loc) {
    if (loc.visibility === 'public' || isPrivileged || isOwner) {
      canShowTeaRoom = true;
    } else if (email) {
      const { data: attendedAtLocation } = await db
        .from('chakai_attendees')
        .select('chakai_id, accounts!inner(email), chakai:chakai!inner(location_id)')
        .eq('accounts.email', email)
        .eq('chakai.location_id', loc.id);
      canShowTeaRoom = !!(attendedAtLocation && attendedAtLocation.length);
    }
  }
  const { data: attendees } = await db
    .from('chakai_attendees')
    .select('accounts(id, full_name_en, full_name_ja, email)')
    .eq('chakai_id', c.id);
  const { data: itemRows } = await db
    .from('chakai_items')
    .select('objects(id, token, title, title_ja, local_number)')
    .eq('chakai_id', c.id);
  const itemObjects: any[] = (itemRows || []).map((r: any) => r.objects);
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

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold">
          {c.name_en || c.name_ja || c.local_number || date}
          {c.name_en && c.name_ja ? (
            <span className="text-sm text-gray-700 ml-2" lang="ja">/ {c.name_ja}</span>
          ) : null}
        </h1>
        {isPrivileged ? (
          <div className="flex items-center gap-4">
            <Link className="text-sm underline leading-none" href={`/admin/chakai/${c.id}`}>Edit</Link>
            {isOwner ? (
              <Link className="text-sm text-red-600 underline leading-none" href={`/admin/chakai/${c.id}`}>Delete</Link>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="text-sm text-gray-700 mb-4">{date}{time ? ` ${time}` : ''}{loc ? ` · ${loc.name}` : ''}{c.local_number ? ` · ${c.local_number}` : ''}</div>
      {c.notes ? <p className="mb-4 whitespace-pre-wrap" aria-label="Notes">{c.notes}</p> : null}
      {loc && canShowTeaRoom ? (
        <section className="mb-6">
          <h2 className="font-medium">Tea Room <span className="text-sm text-gray-700" lang="ja">/ 茶室</span></h2>
          <div className="text-sm">{(loc as any).name_en || (loc as any).name_ja || (loc as any).name}{loc.local_number ? ` (${loc.local_number})` : ''}</div>
          {(loc as any).address_en || (loc as any).address_ja || (loc as any).address ? (
            <div className="text-sm">{(loc as any).address_en || (loc as any).address_ja || (loc as any).address}</div>
          ) : null}
          {(loc as any).lat != null && (loc as any).lng != null ? (
            <iframe
              title="Map"
              className="w-full h-40 rounded border mt-2"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${encodeURIComponent(String((loc as any).lat)+','+String((loc as any).lng))}&hl=en&z=15&output=embed`}
            />
          ) : null}
          {loc.url ? <a className="text-sm underline" href={loc.url} target="_blank" rel="noreferrer">Website</a> : null}
        </section>
      ) : null}
      <section className="mb-6">
        <h2 className="font-medium">Attendees</h2>
        {!attendees?.length ? <div className="text-sm">—</div> : (
          <ul className="list-disc pl-5 text-sm">
            {attendees!.map((r: any, i: number) => {
              const a = (r as any).accounts;
              const name = a.full_name_en || a.full_name_ja || a.email;
              return <li key={i}>{name}</li>;
            })}
          </ul>
        )}
      </section>
      <section className="mb-6">
        <h2 className="font-medium">Items used</h2>
        {!itemObjects?.length ? <div className="text-sm">—</div> : (
          <div className="grid" style={{ gap: 8 }}>
            {itemObjects!.map((o: any, i: number) => {
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
                    <a className="underline" href={`/id/${o.token}`}>{label}</a>{secondary ? <span className="text-xs text-gray-700 ml-2" lang="en">/ {secondary}</span> : null}{o.local_number ? ` (${o.local_number})` : ''}
                  </div>
                  <a className="text-xs underline" href={`/id/${o.token}`}>View</a>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}


