import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getCurrentRole } from '@/lib/auth';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = {
  'application/pdf': 10 * 1024 * 1024, // 10MB for PDFs
  'image/jpeg': 5 * 1024 * 1024, // 5MB for images
  'image/png': 5 * 1024 * 1024,
  'image/webp': 5 * 1024 * 1024,
} as const;

const ALLOWED_MIME_TYPES = Object.keys(MAX_FILE_SIZE);

export async function POST(request: NextRequest) {
  try {
    const { role, account } = await getCurrentRole();
    
    // Only admin/owner can upload media
    if (role !== 'admin' && role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('entityType') as string; // 'chakai', 'object', 'location'
    const entityId = formData.get('entityId') as string;
    const visibility = formData.get('visibility') as string || 'public';

    if (!file || !entityType || !entityId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: `File type not allowed. Supported types: ${ALLOWED_MIME_TYPES.join(', ')}` 
      }, { status: 400 });
    }

    // Validate file size
    const maxSize = MAX_FILE_SIZE[file.type as keyof typeof MAX_FILE_SIZE];
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB` 
      }, { status: 400 });
    }

    // Validate visibility
    if (!['public', 'private'].includes(visibility)) {
      return NextResponse.json({ error: 'Invalid visibility value' }, { status: 400 });
    }

    const db = supabaseAdmin();

    // Verify entity exists
    const entityTables = {
      'chakai': 'chakai',
      'object': 'objects', 
      'location': 'locations'
    };

    const tableName = entityTables[entityType as keyof typeof entityTables];
    if (!tableName) {
      return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
    }

    const { data: entity } = await db
      .from(tableName)
      .select('id')
      .eq('id', entityId)
      .single();

    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    // Generate unique filename
    const fileExtension = file.type === 'application/pdf' ? 'pdf' : file.name.split('.').pop();
    const uniqueId = nanoid();
    const fileName = `${entityType}/${entityId}/${uniqueId}.${fileExtension}`;

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await db.storage
      .from('media')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Create media record (only basic columns - avoid columns that may not exist in production)
    const { data: mediaRecord, error: mediaError } = await db
      .from('media')
      .insert({
        uri: uploadData.path,
        kind: file.type === 'application/pdf' ? 'pdf' : 'image',
        sort_order: 0
      })
      .select()
      .single();

    if (mediaError) {
      // Cleanup uploaded file
      await db.storage.from('media').remove([uploadData.path]);
      console.error('Media record error:', mediaError);
      return NextResponse.json({ error: 'Failed to create media record' }, { status: 500 });
    }

    // Create link record (only support chakai for now to ensure compatibility)
    if (entityType === 'chakai') {
      const { error: linkError } = await db
        .from('chakai_media_links')
        .insert({
          chakai_id: entityId,
          media_id: mediaRecord.id,
          role: file.type === 'application/pdf' ? 'attachment' : 'related'
        });

      if (linkError) {
        // Cleanup media record and file
        await db.from('media').delete().eq('id', mediaRecord.id);
        await db.storage.from('media').remove([uploadData.path]);
        console.error('Link creation error:', linkError);
        return NextResponse.json({ error: 'Failed to create media link' }, { status: 500 });
      }
    } else {
      // For non-chakai entities, clean up for now since we don't have those link tables ready
      await db.from('media').delete().eq('id', mediaRecord.id);
      await db.storage.from('media').remove([uploadData.path]);
      return NextResponse.json({ error: 'Only chakai media uploads supported currently' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      media: {
        id: mediaRecord.id,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        visibility: visibility,
        storagePath: uploadData.path
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}