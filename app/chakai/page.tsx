import { supabaseAdmin } from '@/lib/supabase/server';
import { currentUserEmail, requireAdmin } from '@/lib/auth';

export default async function ChakaiListPage() {
  const email = await currentUserEmail();
  const isPrivileged = await requireAdmin();
  const db = supabaseAdmin();

  // Visible if open; if members: include only if user is attendee; if closed: only admin/owner
  // We rely on RLS for defense in depth, but filter here for UX.
  let query = db
    .from('chakai')
    .select('id, token, name_en, name_ja, local_number, event_date, start_time, visibility, locations(id, name)')
    .order('event_date', { ascending: false })
    .limit(200);

  const { data: all, error } = await query;
  if (error) console.error('[chakai list] query error', error.message || error);
  let list = Array.isArray(all) ? all : [];

  if (!isPrivileged) {
    if (email) {
      // Filter to open or where the user is an attendee
      const { data: attendeeChakaiIds } = await db
        .from('chakai_attendees')
        .select('chakai_id, accounts!inner(email)')
        .eq('accounts.email', email);
      const allowedIds = new Set((attendeeChakaiIds || []).map((r: any) => r.chakai_id));
      list = list.filter((c: any) => c.visibility === 'open' || allowedIds.has(c.id));
    } else {
      list = list.filter((c: any) => c.visibility === 'open');
    }
  }

  // locations joined in main query

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Chakai</h1>
      {!list.length ? (
        <div className="rounded border border-border bg-card p-4 text-sm text-muted-foreground">No chakai available.</div>
      ) : (
        <div className="grid gap-2">
          {list.map((c: any) => {
            const loc = (c as any).locations || null;
            const date = c.event_date ? new Date(c.event_date).toISOString().slice(0, 10) : '';
            const time = c.start_time ? String(c.start_time).slice(0, 5) : '';
            const title = c.name_en || c.name_ja || c.local_number || date;
            return (
              <div key={c.id} className="grid items-center rounded border border-border bg-card p-3" style={{ gridTemplateColumns: '1fr auto' }}>
                <div>
                  <div className="line-clamp-2 text-base font-medium leading-snug">
                    <a className="hover:underline" href={`/chakai/${c.token || c.id}`}>{title}</a>
                    {c.name_en && c.name_ja ? <span className="ml-2 text-sm text-muted-foreground" lang="ja">/ {c.name_ja}</span> : null}
                  </div>
                  <div className="mt-0.5 text-sm text-muted-foreground">{date}{time ? ` ${time}` : ''}{loc ? ` · ${loc.name}` : ''}{c.local_number ? ` · ${c.local_number}` : ''}</div>
                </div>
                <div className="text-xs text-muted-foreground">{c.visibility}</div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}


