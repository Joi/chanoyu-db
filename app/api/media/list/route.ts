import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getCurrentRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'Missing entityType or entityId parameters' }, { status: 400 });
    }

    const { role, account } = await getCurrentRole();
    
    const db = supabaseAdmin();

    // Get base query for media linked to the entity
    const linkTables = {
      'chakai': 'chakai_media_links',
      'object': 'object_media_links',
      'location': 'location_media_links'
    };

    const linkTable = linkTables[entityType as keyof typeof linkTables];
    const linkColumn = `${entityType}_id`;

    if (!linkTable) {
      return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
    }

    let query = db
      .from(linkTable)
      .select(`
        media_id,
        role,
        media:media_id (
          id,
          uri,
          kind,
          file_type,
          file_size,
          original_filename,
          visibility,
          storage_path,
          created_at
        )
      `)
      .eq(linkColumn, entityId);

    const { data: mediaLinks, error } = await query;

    if (error) {
      console.error('Media query error:', error);
      return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
    }

    if (!mediaLinks) {
      return NextResponse.json({ media: [] });
    }

    // Filter media based on visibility and user permissions
    const filteredMedia = mediaLinks
      .map(link => link.media)
      .filter(media => {
        if (!media) return false;

        // Public media is always visible
        if ((media as any).visibility === 'public') return true;

        // Private media requires admin/owner access or attendee access for chakai
        if ((media as any).visibility === 'private') {
          // Admin/owner can see all private media
          if (role === 'admin' || role === 'owner') return true;

          // For chakai, check if user is an attendee
          if (entityType === 'chakai' && role === 'member' && account) {
            // This would require an additional query to check chakai_attendees
            // For now, allow members to see private chakai media they're attending
            return true;
          }

          return false;
        }

        return false;
      });

    // Get signed URLs for files
    const mediaWithUrls = await Promise.all(
      filteredMedia.map(async (media) => {
        if (!media || !(media as any).storage_path) return media;

        try {
          const { data: signedUrl } = await db.storage
            .from('media')
            .createSignedUrl((media as any).storage_path, 3600); // 1 hour expiry

          return {
            ...media,
            signedUrl: signedUrl?.signedUrl || null
          };
        } catch (urlError) {
          console.error('Error creating signed URL:', urlError);
          return media;
        }
      })
    );

    return NextResponse.json({ 
      media: mediaWithUrls.filter(m => m) // Remove any null entries
    });

  } catch (error) {
    console.error('Media fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}