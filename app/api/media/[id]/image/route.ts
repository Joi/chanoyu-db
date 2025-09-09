import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getCurrentRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/media/[id]/image - Serve media image with proper access control
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mediaId = params.id;
    const db = supabaseAdmin();

    // Get media record
    const { data: media, error: mediaError } = await db
      .from('media')
      .select('id, uri, visibility, storage_path, bucket, file_type')
      .eq('id', mediaId)
      .maybeSingle();

    if (mediaError) {
      console.error('Database error fetching media:', mediaError);
      return new NextResponse('Internal server error', { status: 500 });
    }

    if (!media) {
      return new NextResponse('Media not found', { status: 404 });
    }

    // Check visibility and access control
    if (media.visibility === 'private') {
      const { role } = await getCurrentRole();
      
      if (role === 'visitor') {
        return new NextResponse('Authentication required', { status: 401 });
      }

      if (role !== 'admin' && role !== 'owner') {
        return new NextResponse('Access denied', { status: 403 });
      }
    }

    // If the media has a direct URI (external or public URL), redirect to it
    if (media.uri && !media.storage_path) {
      return NextResponse.redirect(media.uri);
    }

    // If it's stored in Supabase Storage, get the signed URL or public URL
    if (media.storage_path && media.bucket) {
      if (media.visibility === 'public') {
        // For public media, use public URL
        const { data: urlData } = db.storage
          .from(media.bucket)
          .getPublicUrl(media.storage_path);
        
        return NextResponse.redirect(urlData.publicUrl);
      } else {
        // For private media, create a signed URL
        const { data: urlData, error: urlError } = await db.storage
          .from(media.bucket)
          .createSignedUrl(media.storage_path, 60 * 60); // 1 hour expiry

        if (urlError) {
          console.error('Storage URL error:', urlError);
          return new NextResponse('Failed to generate media URL', { status: 500 });
        }

        return NextResponse.redirect(urlData.signedUrl);
      }
    }

    // If media.uri exists, redirect to it (fallback)
    if (media.uri) {
      return NextResponse.redirect(media.uri);
    }

    return new NextResponse('Media not accessible', { status: 404 });

  } catch (error) {
    console.error('Error serving media image:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}