import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getCurrentRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

// PATCH: Update media visibility
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { role } = await getCurrentRole();
    
    // Only admin/owner can update media visibility
    if (role !== 'admin' && role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { visibility } = await request.json();
    
    if (!['public', 'private'].includes(visibility)) {
      return NextResponse.json({ error: 'Invalid visibility value' }, { status: 400 });
    }

    const db = supabaseAdmin();

    const { data, error } = await db
      .from('media')
      .update({ visibility })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Media update error:', error);
      return NextResponse.json({ error: 'Failed to update media' }, { status: 500 });
    }

    return NextResponse.json({ media: data });

  } catch (error) {
    console.error('Media update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove media file and record
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { role } = await getCurrentRole();
    
    // Only admin/owner can delete media
    if (role !== 'admin' && role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = supabaseAdmin();

    // Get media record first
    const { data: media, error: fetchError } = await db
      .from('media')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (fetchError || !media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Delete from storage
    if (media.storage_path) {
      const { error: storageError } = await db.storage
        .from('media')
        .remove([media.storage_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue with database deletion even if storage fails
      }
    }

    // Delete media record (this will cascade to link tables)
    const { error: deleteError } = await db
      .from('media')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Media deletion error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Media deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}