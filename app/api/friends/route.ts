import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getCurrentRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/friends - Get all friends and friend requests for current user
export async function GET() {
  const { role, account } = await getCurrentRole();
  
  if (role === 'visitor' || !account) {
    return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
  }

  const db = supabaseAdmin();

  try {
    const { data: friendships, error } = await db
      .from('friends')
      .select(`
        id,
        requester_id,
        recipient_id,
        status,
        created_at,
        updated_at,
        requester:accounts!friends_requester_id_fkey(
          id,
          full_name_en,
          full_name_ja,
          email,
          profile_picture_id
        ),
        recipient:accounts!friends_recipient_id_fkey(
          id,
          full_name_en,
          full_name_ja,
          email,
          profile_picture_id
        )
      `)
      .or(`requester_id.eq.${account.id},recipient_id.eq.${account.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error fetching friendships:', error);
      return NextResponse.json({ ok: false, error: 'Failed to fetch friendships' }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      data: friendships || [],
      currentUserId: account.id
    });

  } catch (error) {
    console.error('Error fetching friendships:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/friends - Send a friend request
export async function POST(request: NextRequest) {
  const { role, account } = await getCurrentRole();
  
  if (role === 'visitor' || !account) {
    return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { recipient_id } = body;

    if (!recipient_id) {
      return NextResponse.json({ ok: false, error: 'Recipient ID is required' }, { status: 400 });
    }

    // Prevent self-friendship
    if (recipient_id === account.id) {
      return NextResponse.json({ ok: false, error: 'Cannot send friend request to yourself' }, { status: 400 });
    }

    const db = supabaseAdmin();

    // Check if recipient exists
    const { data: recipient, error: recipientError } = await db
      .from('accounts')
      .select('id')
      .eq('id', recipient_id)
      .maybeSingle();

    if (recipientError) {
      console.error('Database error checking recipient:', recipientError);
      return NextResponse.json({ ok: false, error: 'Failed to verify recipient' }, { status: 500 });
    }

    if (!recipient) {
      return NextResponse.json({ ok: false, error: 'Recipient not found' }, { status: 404 });
    }

    // Check if friendship already exists
    const { data: existingFriendship, error: existingError } = await db
      .from('friends')
      .select('id, status')
      .or(`and(requester_id.eq.${account.id},recipient_id.eq.${recipient_id}),and(requester_id.eq.${recipient_id},recipient_id.eq.${account.id})`)
      .maybeSingle();

    if (existingError) {
      console.error('Database error checking existing friendship:', existingError);
      return NextResponse.json({ ok: false, error: 'Failed to check existing friendship' }, { status: 500 });
    }

    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        return NextResponse.json({ ok: false, error: 'You are already friends' }, { status: 400 });
      } else if (existingFriendship.status === 'pending') {
        return NextResponse.json({ ok: false, error: 'Friend request already pending' }, { status: 400 });
      }
    }

    // Create friend request
    const { data: newFriendship, error: insertError } = await db
      .from('friends')
      .insert({
        requester_id: account.id,
        recipient_id: recipient_id,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database error creating friendship:', insertError);
      return NextResponse.json({ ok: false, error: 'Failed to send friend request' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: newFriendship });

  } catch (error) {
    console.error('Error sending friend request:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}