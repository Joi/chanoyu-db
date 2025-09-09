import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getCurrentRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/profile/picture - Upload a profile picture
export async function POST(request: NextRequest) {
  const { role, account } = await getCurrentRole();
  
  if (role === 'visitor' || !account) {
    return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ ok: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        ok: false, 
        error: 'File too large. Maximum size is 2MB.' 
      }, { status: 400 });
    }

    const db = supabaseAdmin();

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `profile-${account.id}-${timestamp}.${extension}`;
    const storagePath = `profile-pictures/${filename}`;

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: storageData, error: storageError } = await db.storage
      .from('media')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (storageError) {
      console.error('Storage upload error:', storageError);
      return NextResponse.json({ ok: false, error: 'Failed to upload file' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = db.storage
      .from('media')
      .getPublicUrl(storagePath);

    // Create media record
    const { data: mediaRecord, error: mediaError } = await db
      .from('media')
      .insert({
        kind: 'image',
        uri: urlData.publicUrl,
        storage_path: storagePath,
        bucket: 'media',
        original_filename: file.name,
        file_type: file.type,
        file_size: file.size,
        visibility: 'public',
        sort_order: 0
      })
      .select()
      .single();

    if (mediaError) {
      console.error('Database error creating media record:', mediaError);
      // Clean up uploaded file
      await db.storage.from('media').remove([storagePath]);
      return NextResponse.json({ ok: false, error: 'Failed to create media record' }, { status: 500 });
    }

    // Remove old profile picture if it exists
    if (account.profile_picture_id) {
      const { data: oldMedia } = await db
        .from('media')
        .select('storage_path, bucket')
        .eq('id', account.profile_picture_id)
        .maybeSingle();

      if (oldMedia?.storage_path && oldMedia?.bucket) {
        // Delete from storage
        await db.storage.from(oldMedia.bucket).remove([oldMedia.storage_path]);
        // Delete media record
        await db.from('media').delete().eq('id', account.profile_picture_id);
      }
    }

    // Update account with new profile picture
    const { error: updateError } = await db
      .from('accounts')
      .update({ profile_picture_id: mediaRecord.id })
      .eq('id', account.id);

    if (updateError) {
      console.error('Database error updating account:', updateError);
      // Clean up uploaded file and media record
      await db.storage.from('media').remove([storagePath]);
      await db.from('media').delete().eq('id', mediaRecord.id);
      return NextResponse.json({ ok: false, error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      data: {
        media_id: mediaRecord.id,
        url: urlData.publicUrl
      }
    });

  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/profile/picture - Remove profile picture
export async function DELETE() {
  const { role, account } = await getCurrentRole();
  
  if (role === 'visitor' || !account) {
    return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
  }

  if (!account.profile_picture_id) {
    return NextResponse.json({ ok: false, error: 'No profile picture to remove' }, { status: 400 });
  }

  try {
    const db = supabaseAdmin();

    // Get media record
    const { data: media, error: mediaFetchError } = await db
      .from('media')
      .select('storage_path, bucket')
      .eq('id', account.profile_picture_id)
      .maybeSingle();

    if (mediaFetchError) {
      console.error('Database error fetching media:', mediaFetchError);
      return NextResponse.json({ ok: false, error: 'Failed to fetch media record' }, { status: 500 });
    }

    // Remove profile picture reference from account
    const { error: updateError } = await db
      .from('accounts')
      .update({ profile_picture_id: null })
      .eq('id', account.id);

    if (updateError) {
      console.error('Database error updating account:', updateError);
      return NextResponse.json({ ok: false, error: 'Failed to update profile' }, { status: 500 });
    }

    // Clean up storage and media record
    if (media?.storage_path && media?.bucket) {
      try {
        // Delete from storage (don't fail if this fails)
        await db.storage.from(media.bucket).remove([media.storage_path]);
        // Delete media record
        await db.from('media').delete().eq('id', account.profile_picture_id);
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
        // Continue - the main operation (removing profile_picture_id) succeeded
      }
    }

    return NextResponse.json({ ok: true, message: 'Profile picture removed successfully' });

  } catch (error) {
    console.error('Error removing profile picture:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}