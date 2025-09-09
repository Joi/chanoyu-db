import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getCurrentRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// PUT /api/friends/[id] - Accept or decline a friend request
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { role, account } = await getCurrentRole();
  
  if (role === 'visitor' || !account) {
    return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;
    const friendshipId = params.id;

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ ok: false, error: 'Action must be "accept" or "decline"' }, { status: 400 });
    }

    const db = supabaseAdmin();

    // Get the friendship request
    const { data: friendship, error: fetchError } = await db
      .from('friends')
      .select('*')
      .eq('id', friendshipId)
      .eq('status', 'pending')
      .maybeSingle();

    if (fetchError) {
      console.error('Database error fetching friendship:', fetchError);
      return NextResponse.json({ ok: false, error: 'Failed to fetch friend request' }, { status: 500 });
    }

    if (!friendship) {
      return NextResponse.json({ ok: false, error: 'Friend request not found or already processed' }, { status: 404 });
    }

    // Verify the current user is the recipient
    if (friendship.recipient_id !== account.id) {
      return NextResponse.json({ ok: false, error: 'You can only respond to requests sent to you' }, { status: 403 });
    }

    // Update the friendship status
    const newStatus = action === 'accept' ? 'accepted' : 'declined';
    const { data: updatedFriendship, error: updateError } = await db
      .from('friends')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', friendshipId)
      .select()
      .single();

    if (updateError) {
      console.error('Database error updating friendship:', updateError);
      return NextResponse.json({ ok: false, error: 'Failed to update friend request' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: updatedFriendship });

  } catch (error) {
    console.error('Error updating friend request:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/friends/[id] - Remove a friendship or cancel a friend request
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { role, account } = await getCurrentRole();
  
  if (role === 'visitor' || !account) {
    return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
  }

  try {
    const friendshipId = params.id;
    const db = supabaseAdmin();

    // Get the friendship
    const { data: friendship, error: fetchError } = await db
      .from('friends')
      .select('*')
      .eq('id', friendshipId)
      .maybeSingle();

    if (fetchError) {
      console.error('Database error fetching friendship:', fetchError);
      return NextResponse.json({ ok: false, error: 'Failed to fetch friendship' }, { status: 500 });
    }

    if (!friendship) {
      return NextResponse.json({ ok: false, error: 'Friendship not found' }, { status: 404 });
    }

    // Verify the current user is involved in this friendship
    if (friendship.requester_id !== account.id && friendship.recipient_id !== account.id) {
      return NextResponse.json({ ok: false, error: 'You are not part of this friendship' }, { status: 403 });
    }

    // Delete the friendship
    const { error: deleteError } = await db
      .from('friends')
      .delete()
      .eq('id', friendshipId);

    if (deleteError) {
      console.error('Database error deleting friendship:', deleteError);
      return NextResponse.json({ ok: false, error: 'Failed to remove friendship' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Friendship removed successfully' });

  } catch (error) {
    console.error('Error removing friendship:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}