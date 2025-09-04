import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { currentUserEmail, requireAdmin } from '@/lib/auth';

const SEARCH_RESULT_LIMIT = 12;

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json([]);
  
  const db = supabaseAdmin();
  const email = await currentUserEmail();
  const isPrivileged = await requireAdmin();
  
  const like = `%${q}%`;
  
  let query = db
    .from('chakai')
    .select('id, name_en, name_ja, local_number, event_date, visibility')
    .or(`name_en.ilike.${like},name_ja.ilike.${like},local_number.ilike.${like}`)
    .order('event_date', { ascending: false })
    .limit(SEARCH_RESULT_LIMIT);

  // Apply visibility filters
  if (!isPrivileged) {
    if (email) {
      // Authenticated user can see public and member events they attend
      query = query.or('visibility.eq.public,visibility.eq.open');
    } else {
      // Anonymous user can only see public and open events
      query = query.or('visibility.eq.public,visibility.eq.open');
    }
  }
  // Privileged users can see all events (no additional filter)

  const { data, error } = await query;
  if (error) {
    console.error('[search/chakai] error', { message: error.message, details: error.details });
    return NextResponse.json({ code: 'SEARCH_CHAKAI_FAILED', message: 'Failed to search chakai' }, { status: 500 });
  }

  // For non-privileged users, further filter member events to only include ones they attend
  let filteredData = data || [];
  if (!isPrivileged && email) {
    const memberEvents = filteredData.filter((c: any) => c.visibility === 'members');
    if (memberEvents.length > 0) {
      const memberEventIds = memberEvents.map((c: any) => c.id);
      const { data: attendeeChecks } = await db
        .from('chakai_attendees')
        .select('chakai_id, accounts!inner(email)')
        .in('chakai_id', memberEventIds)
        .eq('accounts.email', email);
      
      const allowedMemberEventIds = new Set((attendeeChecks || []).map((a: any) => a.chakai_id));
      filteredData = filteredData.filter((c: any) => 
        c.visibility !== 'members' || allowedMemberEventIds.has(c.id)
      );
    }
  }
  
  // Remove visibility field from response (internal field)
  const responseData = filteredData.map(({ visibility, ...rest }: any) => rest);
  const headers = new Headers();
  headers.set('Cache-Control', 'public, max-age=30, s-maxage=30');
  headers.set('CDN-Cache-Control', 'public, max-age=30, s-maxage=30');
  return NextResponse.json(responseData, { headers });
}


