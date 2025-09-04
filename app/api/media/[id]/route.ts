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
    console.log('[media] Fetching media record for ID:', mediaId);
    const { data: media, error: mediaError } = await db
      .from('media')
      .select('id, uri, file_type, original_filename, storage_path, bucket')
      .eq('id', mediaId)
      .single();

    if (mediaError || !media) {
      console.error('[media] Media not found:', { mediaId, error: mediaError });
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    console.log('[media] Found media record:', media);

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
      // For open chakai, users can access media (simplified for now)
      canAccessMedia = true;
    } else if (chakai.visibility === 'members' && email) {
      // For members-only chakai, check if user is an attendee
      const { data: attendeeCheck } = await db
        .from('chakai_attendees')
        .select('chakai_id, accounts!inner(email)')
        .eq('chakai_id', chakai.id)
        .eq('accounts.email', email)
        .single();

      if (attendeeCheck) {
        // Attendees can access media
        canAccessMedia = true;
      }
    }

    if (!canAccessMedia) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get the file from Supabase storage using the storage path
    console.log('[media] Downloading file from storage:', media.storage_path || media.uri);
    
    const storagePath = media.storage_path || media.uri;
    const { data: fileData, error: downloadError } = await db.storage
      .from(media.bucket || 'media')
      .download(storagePath);

    if (downloadError || !fileData) {
      console.error('[media] Storage download failed:', downloadError);
      return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
    }

    const buffer = await fileData.arrayBuffer();
    
    // Set appropriate headers for the media type
    const headers = new Headers();
    headers.set('Content-Type', media.file_type || 'application/octet-stream');
    
    // Add content disposition for download if requested
    const download = req.nextUrl.searchParams.get('download');
    if (media.original_filename) {
      // Encode filename to handle non-ASCII characters (like Japanese)
      const encodedFilename = encodeURIComponent(media.original_filename);
      const safeFilename = media.original_filename.replace(/[^\x00-\x7F]/g, '_'); // ASCII fallback
      
      const dispositionType = download === 'true' ? 'attachment' : 'inline';
      headers.set('Content-Disposition', 
        `${dispositionType}; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`
      );
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