import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { currentUserEmail, requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const mediaId = params.id;
  
  if (!mediaId) {
    return NextResponse.json({ error: 'Media ID required' }, { status: 400 });
  }

  try {
    const db = supabaseAdmin();
    const email = await currentUserEmail();
    const isPrivileged = await requireAdmin();

    // First, get the media record and check what chakai it's linked to
    const { data: media, error: mediaError } = await db
      .from('media')
      .select('id, uri, file_type, original_filename, visibility')
      .eq('id', mediaId)
      .single();

    if (mediaError || !media) {
      console.error('[media] Media not found:', mediaError);
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Get the chakai this media is linked to
    const { data: linkData, error: linkError } = await db
      .from('chakai_media_links')
      .select('chakai_id, chakai:chakai!inner(id, visibility)')
      .eq('media_id', mediaId)
      .single();

    if (linkError || !linkData) {
      console.error('[media] Media link not found:', linkError);
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    const chakai = linkData.chakai as any;
    
    // Apply the same access control logic as the main app
    let canAccessMedia = false;

    if (isPrivileged) {
      // Admins/owners can access all media
      canAccessMedia = true;
    } else if (chakai.visibility === 'open') {
      // For open chakai, users can access public media
      canAccessMedia = media.visibility === 'public';
    } else if (chakai.visibility === 'members' && email) {
      // For members-only chakai, check if user is an attendee
      const { data: attendeeCheck } = await db
        .from('chakai_attendees')
        .select('chakai_id, accounts!inner(email)')
        .eq('chakai_id', chakai.id)
        .eq('accounts.email', email)
        .single();

      if (attendeeCheck) {
        // Attendees can access both public and private media
        canAccessMedia = true;
      }
    }

    if (!canAccessMedia) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch the actual file from Supabase storage
    const response = await fetch(media.uri);
    
    if (!response.ok) {
      console.error('[media] Storage fetch failed:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
    }

    const buffer = await response.arrayBuffer();
    
    // Set appropriate headers for the media type
    const headers = new Headers();
    headers.set('Content-Type', media.file_type || 'application/octet-stream');
    
    // Add content disposition for download if requested
    const download = req.nextUrl.searchParams.get('download');
    if (download === 'true' && media.original_filename) {
      headers.set('Content-Disposition', `attachment; filename="${media.original_filename}"`);
    } else if (media.original_filename) {
      headers.set('Content-Disposition', `inline; filename="${media.original_filename}"`);
    }
    
    // Add cache headers for efficient delivery
    headers.set('Cache-Control', 'private, max-age=3600');
    headers.set('Content-Length', buffer.byteLength.toString());

    return new NextResponse(buffer, { headers });

  } catch (error) {
    console.error('[media] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}