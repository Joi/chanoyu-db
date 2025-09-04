import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { mintToken } from '@/lib/id';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const chakaiId = params.id;
  
  try {
    // Check admin permissions
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (!chakaiId) {
      return NextResponse.json({ error: 'Chakai ID required' }, { status: 400 });
    }

    // Verify chakai exists
    const db = supabaseAdmin();
    const { data: chakai, error: chakaiError } = await db
      .from('chakai')
      .select('id')
      .eq('id', chakaiId)
      .single();

    if (chakaiError || !chakai) {
      return NextResponse.json({ error: 'Chakai not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const visibility = formData.get('visibility') as string || 'public';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type (allow PDFs and common image formats)
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Allowed: PDF, JPEG, PNG, GIF, WebP' 
      }, { status: 400 });
    }

    // File size limit: 50MB
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size: 50MB' 
      }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'bin';
    const storagePath = `chakai-media/${chakaiId}/${mintToken()}.${ext}`;

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await db.storage
      .from('media')
      .upload(storagePath, file, {
        contentType: file.type,
        duplex: 'half'
      });

    if (uploadError) {
      console.error('[chakai-media] Upload error:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = db.storage
      .from('media')
      .getPublicUrl(storagePath);

    // Insert media record
    const { data: mediaData, error: mediaError } = await db
      .from('media')
      .insert({
        token: mintToken(),
        uri: urlData.publicUrl,
        kind: file.type.startsWith('image/') ? 'image' : 'file',
        file_type: file.type,
        file_size: file.size,
        original_filename: file.name,
        visibility: visibility
      })
      .select('id, uri, file_type, original_filename, visibility')
      .single();

    if (mediaError) {
      console.error('[chakai-media] Media insert error:', mediaError);
      
      // Clean up uploaded file on error
      await db.storage.from('media').remove([storagePath]);
      
      return NextResponse.json({ error: 'Failed to create media record' }, { status: 500 });
    }

    // Link media to chakai
    const { error: linkError } = await db
      .from('chakai_media_links')
      .insert({
        chakai_id: chakaiId,
        media_id: mediaData.id,
        role: 'attachment'
      });

    if (linkError) {
      console.error('[chakai-media] Link error:', linkError);
      
      // Clean up on error
      await db.from('media').delete().eq('id', mediaData.id);
      await db.storage.from('media').remove([storagePath]);
      
      return NextResponse.json({ error: 'Failed to link media to chakai' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      media: mediaData
    });

  } catch (error) {
    console.error('[chakai-media] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const chakaiId = params.id;
  
  try {
    // Check admin permissions
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const mediaId = searchParams.get('mediaId');

    if (!mediaId) {
      return NextResponse.json({ error: 'Media ID required' }, { status: 400 });
    }

    const db = supabaseAdmin();

    // Get media info before deletion for cleanup
    const { data: media } = await db
      .from('media')
      .select('id, uri')
      .eq('id', mediaId)
      .single();

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Verify the link exists
    const { data: linkData } = await db
      .from('chakai_media_links')
      .select('chakai_id')
      .eq('chakai_id', chakaiId)
      .eq('media_id', mediaId)
      .single();

    if (!linkData) {
      return NextResponse.json({ error: 'Media not linked to this chakai' }, { status: 404 });
    }

    // Remove the link
    const { error: linkError } = await db
      .from('chakai_media_links')
      .delete()
      .eq('chakai_id', chakaiId)
      .eq('media_id', mediaId);

    if (linkError) {
      console.error('[chakai-media] Link deletion error:', linkError);
      return NextResponse.json({ error: 'Failed to remove media link' }, { status: 500 });
    }

    // Check if media is linked to other chakai/objects before deleting
    const { data: otherLinks } = await db
      .from('chakai_media_links')
      .select('chakai_id')
      .eq('media_id', mediaId);

    const { data: objectLinks } = await db
      .from('object_media_links')
      .select('object_id')
      .eq('media_id', mediaId);

    // Only delete media record and file if not linked elsewhere
    if ((!otherLinks || otherLinks.length === 0) && (!objectLinks || objectLinks.length === 0)) {
      // Delete media record
      const { error: mediaError } = await db
        .from('media')
        .delete()
        .eq('id', mediaId);

      if (mediaError) {
        console.error('[chakai-media] Media deletion error:', mediaError);
      } else {
        // Extract storage path from URI and delete file
        try {
          const url = new URL(media.uri);
          const storagePath = url.pathname.split('/storage/v1/object/public/media/')[1];
          if (storagePath) {
            await db.storage.from('media').remove([storagePath]);
          }
        } catch (e) {
          console.error('[chakai-media] Storage cleanup error:', e);
        }
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[chakai-media] Delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}