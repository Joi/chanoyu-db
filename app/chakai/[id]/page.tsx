import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { currentUserEmail, requireAdmin, requireOwner } from '@/lib/auth';
import Link from 'next/link';

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
    ? await db.from('locations').select('id, name, address, url, local_number').eq('id', c.location_id).maybeSingle()
    : { data: null } as any;
  const { data: attendees } = await db
    .from('chakai_attendees')
    .select('accounts(id, full_name_en, full_name_ja, email)')
    .eq('chakai_id', c.id);
  const { data: items } = await db
    .from('chakai_items')
    .select('objects(id, token, title, title_ja, local_number)')
    .eq('chakai_id', c.id);

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
      {c.notes ? <p className="mb-4 whitespace-pre-wrap">{c.notes}</p> : null}
      {loc ? (
        <section className="mb-6">
          <h2 className="font-medium">Location</h2>
          <div className="text-sm">{loc.name}{loc.local_number ? ` (${loc.local_number})` : ''}</div>
          {loc.address ? <div className="text-sm">{loc.address}</div> : null}
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
        {!items?.length ? <div className="text-sm">—</div> : (
          <ul className="list-disc pl-5 text-sm">
            {items!.map((r: any, i: number) => {
              const o = (r as any).objects;
              const name = o.title || o.title_ja || o.local_number || o.token;
              return <li key={i}><a className="underline" href={`/id/${o.token}`}>{name}</a></li>;
            })}
          </ul>
        )}
      </section>
    </main>
  );
}


