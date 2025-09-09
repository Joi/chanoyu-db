import { redirect } from 'next/navigation';
import { getCurrentRole, currentUserEmail } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import MemberDiscovery from '@/app/components/MemberDiscovery';
import FriendRequests from '@/app/components/FriendRequests';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MembersLanding() {
  const { role } = await getCurrentRole();
  if (role === 'visitor') return redirect('/login?next=/members');
  
  const email = await currentUserEmail();
  const db = supabaseAdmin();
  
  // Get all members with their profile information
  const { data: members, error: membersError } = await db
    .from('accounts')
    .select('id, full_name_en, full_name_ja, email, profile_picture_id')
    .order('full_name_en', { ascending: true });
  
  // Debug logging
  if (membersError) {
    console.error('Failed to load members:', membersError);
  }
  
  // Get current user's profile ID
  const currentUser = members?.find(m => m.email === email);
  
  return (
    <main className="max-w-2xl mx-auto my-10 px-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Members — 会員</h1>
        {currentUser && (
          <a 
            href={`/profile/${currentUser.id}`} 
            className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            My Profile
          </a>
        )}
      </div>
      <section className="mt-4 space-y-2">
        <p>Quick actions</p>
        <ul className="list-disc pl-5">
          <li><a className="underline" href="/chakai">Start a Chakai</a></li>
          <li><a className="underline" href="/admin/items">Add Item</a></li>
          <li><a className="underline" href="/admin/media">Upload Media</a></li>
          <li><a className="underline" href="/tea-rooms">Create Tea Room</a></li>
        </ul>
      </section>
      <section className="mt-6">
        <h2 className="font-medium">Learn the model</h2>
        <p className="mt-2 text-sm">
          Chakai (茶会) happen in Tea Rooms (茶室) and use Items (道具). Link Media (メディア) to document. Describe Items with
          Local Classes (ローカル分類). External types are resolved via the Local Class preferred Classification (分類).
        </p>
      </section>
      <section className="mt-8 space-y-6">
        {/* Pending Friend Requests */}
        {email && (
          <div>
            <h2 className="text-lg font-medium mb-3">Friend Requests</h2>
            <div className="text-sm text-gray-500 mb-4">
              Invitations sent to you and pending responses
            </div>
            <FriendRequests currentUserEmail={email} />
          </div>
        )}
        
        <MemberDiscovery 
          initialMembers={members || []}
          currentUserEmail={email}
          title="All Members — 全会員"
        />
      </section>
    </main>
  );
}


