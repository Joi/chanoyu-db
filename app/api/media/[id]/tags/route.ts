import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getCurrentRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/media/[id]/tags - Get member tags for a media object
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { role, account } = await getCurrentRole();
  
  if (role === 'visitor' || !account) {
    return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
  }

  try {
    const mediaId = params.id;
    const db = supabaseAdmin();

    // Verify media exists and user has access
    const { data: media, error: mediaError } = await db
      .from('media')
      .select('id, visibility')
      .eq('id', mediaId)
      .maybeSingle();

    if (mediaError) {
      console.error('Database error fetching media:', mediaError);
      return NextResponse.json({ ok: false, error: 'Failed to fetch media' }, { status: 500 });
    }

    if (!media) {
      return NextResponse.json({ ok: false, error: 'Media not found' }, { status: 404 });
    }

    // Check visibility permissions
    if (media.visibility === 'private' && role !== 'admin' && role !== 'owner') {
      return NextResponse.json({ ok: false, error: 'Access denied' }, { status: 403 });
    }

    // Get member tags with account information
    const { data: memberTags, error: tagsError } = await db
      .from('member_tags')
      .select(`
        id,
        account_id,
        tagged_by_id,
        created_at,
        account:accounts!member_tags_account_id_fkey(
          id,
          full_name_en,
          full_name_ja,
          email,
          profile_picture_id
        ),
        tagged_by:accounts!member_tags_tagged_by_id_fkey(
          id,
          full_name_en,
          full_name_ja,
          email
        )
      `)
      .eq('media_id', mediaId)
      .order('created_at', { ascending: true });

    if (tagsError) {
      console.error('Database error fetching member tags:', tagsError);
      return NextResponse.json({ ok: false, error: 'Failed to fetch member tags' }, { status: 500 });
    }

    // For non-admin users, only show tags where they are tagged or have a connection
    let visibleTags = memberTags || [];
    
    if (role !== 'admin' && role !== 'owner') {
      // Get user's friendships
      const { data: friendships } = await db
        .from('friends')
        .select('requester_id, recipient_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${account.id},recipient_id.eq.${account.id}`);

      const friendIds = new Set([account.id]);
      friendships?.forEach(f => {
        friendIds.add(f.requester_id === account.id ? f.recipient_id : f.requester_id);
      });

      // Filter tags to only show connected members
      visibleTags = visibleTags.filter(tag => friendIds.has(tag.account_id));
    }

    return NextResponse.json({ ok: true, data: visibleTags });

  } catch (error) {
    console.error('Error fetching member tags:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/media/[id]/tags - Tag a member in a media object
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { role, account } = await getCurrentRole();
  
  if (role === 'visitor' || !account) {
    return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { account_id } = body;
    const mediaId = params.id;

    if (!account_id) {
      return NextResponse.json({ ok: false, error: 'Account ID is required' }, { status: 400 });
    }

    const db = supabaseAdmin();

    // Verify media exists
    const { data: media, error: mediaError } = await db
      .from('media')
      .select('id, visibility')
      .eq('id', mediaId)
      .maybeSingle();

    if (mediaError) {
      console.error('Database error fetching media:', mediaError);
      return NextResponse.json({ ok: false, error: 'Failed to fetch media' }, { status: 500 });
    }

    if (!media) {
      return NextResponse.json({ ok: false, error: 'Media not found' }, { status: 404 });
    }

    // Verify tagged account exists
    const { data: taggedAccount, error: accountError } = await db
      .from('accounts')
      .select('id')
      .eq('id', account_id)
      .maybeSingle();

    if (accountError) {
      console.error('Database error fetching account:', accountError);
      return NextResponse.json({ ok: false, error: 'Failed to verify account' }, { status: 500 });
    }

    if (!taggedAccount) {
      return NextResponse.json({ ok: false, error: 'Account not found' }, { status: 404 });
    }

    // Check if user can tag this person
    if (account_id !== account.id && role !== 'admin' && role !== 'owner') {
      // Check if they're friends
      const { data: friendship } = await db
        .from('friends')
        .select('id')
        .eq('status', 'accepted')
        .or(`and(requester_id.eq.${account.id},recipient_id.eq.${account_id}),and(requester_id.eq.${account_id},recipient_id.eq.${account.id})`)
        .maybeSingle();

      if (!friendship) {
        return NextResponse.json({ ok: false, error: 'You can only tag yourself or connected members' }, { status: 403 });
      }
    }

    // Check if tag already exists
    const { data: existingTag, error: existingError } = await db
      .from('member_tags')
      .select('id')
      .eq('media_id', mediaId)
      .eq('account_id', account_id)
      .maybeSingle();

    if (existingError) {
      console.error('Database error checking existing tag:', existingError);
      return NextResponse.json({ ok: false, error: 'Failed to check existing tag' }, { status: 500 });
    }

    if (existingTag) {
      return NextResponse.json({ ok: false, error: 'Member is already tagged in this media' }, { status: 400 });
    }

    // Create the tag
    const { data: newTag, error: insertError } = await db
      .from('member_tags')
      .insert({
        media_id: mediaId,
        account_id: account_id,
        tagged_by_id: account.id
      })
      .select(`
        id,
        account_id,
        tagged_by_id,
        created_at,
        account:accounts!member_tags_account_id_fkey(
          id,
          full_name_en,
          full_name_ja,
          email,
          profile_picture_id
        )
      `)
      .single();

    if (insertError) {
      console.error('Database error creating member tag:', insertError);
      return NextResponse.json({ ok: false, error: 'Failed to create member tag' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: newTag });

  } catch (error) {
    console.error('Error creating member tag:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/media/[id]/tags - Remove all tags from media (for admin) or specific tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { role, account } = await getCurrentRole();
  
  if (role === 'visitor' || !account) {
    return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('tag_id');
    const mediaId = params.id;
    const db = supabaseAdmin();

    if (tagId) {
      // Remove specific tag
      const { data: tag, error: fetchError } = await db
        .from('member_tags')
        .select('*')
        .eq('id', tagId)
        .eq('media_id', mediaId)
        .maybeSingle();

      if (fetchError) {
        console.error('Database error fetching tag:', fetchError);
        return NextResponse.json({ ok: false, error: 'Failed to fetch tag' }, { status: 500 });
      }

      if (!tag) {
        return NextResponse.json({ ok: false, error: 'Tag not found' }, { status: 404 });
      }

      // Check permissions - user can only remove tags they created or tags of themselves
      if (tag.tagged_by_id !== account.id && tag.account_id !== account.id && role !== 'admin' && role !== 'owner') {
        return NextResponse.json({ ok: false, error: 'You can only remove tags you created or tags of yourself' }, { status: 403 });
      }

      const { error: deleteError } = await db
        .from('member_tags')
        .delete()
        .eq('id', tagId);

      if (deleteError) {
        console.error('Database error deleting tag:', deleteError);
        return NextResponse.json({ ok: false, error: 'Failed to remove tag' }, { status: 500 });
      }

      return NextResponse.json({ ok: true, message: 'Tag removed successfully' });

    } else {
      // Admin-only: Remove all tags from media
      if (role !== 'admin' && role !== 'owner') {
        return NextResponse.json({ ok: false, error: 'Only admins can remove all tags' }, { status: 403 });
      }

      const { error: deleteError } = await db
        .from('member_tags')
        .delete()
        .eq('media_id', mediaId);

      if (deleteError) {
        console.error('Database error deleting all tags:', deleteError);
        return NextResponse.json({ ok: false, error: 'Failed to remove all tags' }, { status: 500 });
      }

      return NextResponse.json({ ok: true, message: 'All tags removed successfully' });
    }

  } catch (error) {
    console.error('Error removing member tag:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}