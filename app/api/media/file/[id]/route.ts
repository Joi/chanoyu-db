import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getCurrentRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET: Download/view specific media file
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { role, account } = await getCurrentRole();
    
    const db = supabaseAdmin();

    // Get media record
    const { data: media, error } = await db
      .from('media')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Check access permissions
    if (media.visibility === 'private') {
      // Private media requires admin/owner access or specific entity access
      if (role !== 'admin' && role !== 'owner') {
        // Check if user has access through entity membership (e.g., chakai attendee)
        const canAccess = await checkEntityAccess(db, media.id, account?.email || '');
        if (!canAccess) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
      }
    }

    // Create signed URL for file access
    const { data: signedUrl, error: urlError } = await db.storage
      .from('media')
      .createSignedUrl(media.storage_path, 3600); // 1 hour expiry

    if (urlError || !signedUrl) {
      console.error('Error creating signed URL:', urlError);
      return NextResponse.json({ error: 'Failed to generate file URL' }, { status: 500 });
    }

    return NextResponse.json({
      media: {
        ...media,
        signedUrl: signedUrl.signedUrl
      }
    });

  } catch (error) {
    console.error('Media access error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to check if user has access to private media through entity membership
async function checkEntityAccess(db: any, mediaId: string, userEmail: string): Promise<boolean> {
  if (!userEmail) return false;

  try {
    // Check chakai attendee access
    const { data: chakaiAccess } = await db
      .from('chakai_media_links')
      .select(`
        chakai:chakai_id (
          id,
          visibility,
          chakai_attendees (
            account:account_id (
              email
            )
          )
        )
      `)
      .eq('media_id', mediaId);

    if (chakaiAccess) {
      for (const link of chakaiAccess) {
        const chakai = link.chakai;
        if (chakai?.chakai_attendees?.some(
          (attendee: any) => attendee.account?.email === userEmail
        )) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking entity access:', error);
    return false;
  }
}