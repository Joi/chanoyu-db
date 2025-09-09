import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { currentUserEmail, getCurrentRole } from '@/lib/auth';
import Image from 'next/image';
import Link from 'next/link';
import ProfilePicture from '@/app/components/ProfilePicture';
import MemberDiscovery from '@/app/components/MemberDiscovery';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const profileId = params.id;
  const { role } = await getCurrentRole();
  const currentEmail = await currentUserEmail();
  
  // Visitors can't see profiles
  if (role === 'visitor') {
    return notFound();
  }
  
  const db = supabaseAdmin();
  
  // Get the profile user's information
  const { data: profileUser, error } = await db
    .from('accounts')
    .select('id, full_name_en, full_name_ja, email, profile_picture_id, tea_school_id')
    .eq('id', profileId)
    .maybeSingle();
    
  if (error || !profileUser) {
    return notFound();
  }
  
  // Get tea school info if available
  let teaSchool = null;
  if (profileUser.tea_school_id) {
    const { data: school } = await db
      .from('tea_schools')
      .select('id, name_en, name_ja')
      .eq('id', profileUser.tea_school_id)
      .maybeSingle();
    teaSchool = school;
  }
  
  // Get chakai this user has attended
  const { data: chakaiAttended, error: chakaiError } = await db
    .from('chakai_attendees')
    .select(`
      chakai!inner(
        id, 
        token, 
        name_en, 
        name_ja, 
        event_date, 
        local_number
      )
    `)
    .eq('account_id', profileId)
    .limit(10);
    
  if (chakaiError) {
    console.error('Chakai query error:', chakaiError);
  }
  
  // Check if current user can see this profile
  // For now, all logged-in members can see each other's profiles
  // In future, you might want to add privacy settings
  
  const isOwnProfile = currentEmail && profileUser.email === currentEmail;
  const displayName = profileUser.full_name_en || profileUser.full_name_ja || profileUser.email;
  const secondaryName = profileUser.full_name_en && profileUser.full_name_ja ? 
    (displayName === profileUser.full_name_en ? profileUser.full_name_ja : profileUser.full_name_en) : null;

  return (
    <main className="max-w-2xl mx-auto my-10 px-6">
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-start gap-4">
          <div className="relative w-24 h-24 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
            {profileUser.profile_picture_id ? (
              <Image
                src={`/api/media/${profileUser.profile_picture_id}/file`}
                alt={displayName}
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-medium">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">{displayName}</h1>
            {secondaryName && (
              <p className="text-lg text-gray-600 mt-1">{secondaryName}</p>
            )}
            {teaSchool && (
              <p className="text-sm text-gray-500 mt-2">
                <span className="font-medium">Tea School:</span> {teaSchool.name_en || teaSchool.name_ja}
              </p>
            )}
            
            {isOwnProfile && (
              <div className="mt-4">
                <ProfilePicture 
                  currentPictureUrl={profileUser.profile_picture_id ? `/api/media/${profileUser.profile_picture_id}/file` : null} 
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Friend Actions for Other Users */}
        {!isOwnProfile && currentEmail && (
          <div className="border-t pt-4">
            <MemberDiscovery
              initialMembers={[profileUser]}
              currentUserEmail={currentEmail}
              title="Connect"
              showTitle={false}
            />
          </div>
        )}
        
        {/* Recent Chakai */}
        <section>
          <h2 className="text-lg font-medium mb-3">Recent Chakai Attended</h2>
          {!chakaiAttended || chakaiAttended.length === 0 ? (
            <p className="text-sm text-gray-500">No chakai attended yet.</p>
          ) : (
            <div className="space-y-2">
              {chakaiAttended.map((attendance: any) => {
                const chakai = attendance.chakai;
                if (!chakai) return null;
                
                const date = chakai.event_date ? new Date(chakai.event_date).toISOString().slice(0, 10) : '';
                const title = chakai.name_en || chakai.name_ja || chakai.local_number || date;
                
                return (
                  <div key={chakai.id} className="border border-border rounded-lg p-3 bg-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link 
                          href={`/chakai/${chakai.token || chakai.id}`}
                          className="font-medium hover:underline"
                        >
                          {title}
                        </Link>
                        {chakai.name_en && chakai.name_ja && (
                          <span className="text-sm text-gray-500 ml-2">
                            / {title === chakai.name_en ? chakai.name_ja : chakai.name_en}
                          </span>
                        )}
                        <div className="text-sm text-gray-500 mt-1">{date}</div>
                      </div>
                      <Link 
                        href={`/chakai/${chakai.token || chakai.id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}