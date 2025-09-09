'use client';

import { User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Member {
  id: string;
  full_name_en: string | null;
  full_name_ja: string | null;
  email: string;
  profile_picture_id: string | null;
  bio?: string | null;
  bio_ja?: string | null;
  tea_school?: string | null;
  tea_school_ja?: string | null;
}

interface MemberCardProps {
  member: Member;
  showBio?: boolean;
  compact?: boolean;
  linkToProfile?: boolean;
  profilePictureUrl?: string | null;
}

export default function MemberCard({ 
  member, 
  showBio = true, 
  compact = false, 
  linkToProfile = true,
  profilePictureUrl 
}: MemberCardProps) {
  const displayName = member.full_name_en || member.full_name_ja || member.email;
  const japaneseName = member.full_name_ja && member.full_name_ja !== member.full_name_en 
    ? member.full_name_ja 
    : null;

  // Get profile picture URL from props or construct from ID
  const pictureUrl = profilePictureUrl || (member.profile_picture_id 
    ? `/api/media/${member.profile_picture_id}/image` 
    : null);

  const cardContent = (
    <div className={`flex items-start gap-3 ${compact ? '' : 'p-4 border rounded-lg hover:shadow-sm transition-shadow'}`}>
      {/* Profile Picture */}
      <div className={`flex-shrink-0 ${compact ? 'w-10 h-10' : 'w-12 h-12'}`}>
        {pictureUrl ? (
          <div className={`relative ${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-full overflow-hidden border-2 border-gray-200`}>
            <Image
              src={pictureUrl}
              alt={`${displayName}'s profile picture`}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center`}>
            <User className={`${compact ? 'h-5 w-5' : 'h-6 w-6'} text-gray-400`} />
          </div>
        )}
      </div>

      {/* Member Info */}
      <div className="flex-grow min-w-0">
        <div className={`font-medium ${compact ? 'text-sm' : 'text-base'}`}>
          {displayName}
        </div>
        {japaneseName && (
          <div className={`text-gray-600 ${compact ? 'text-xs' : 'text-sm'}`}>
            {japaneseName}
          </div>
        )}
        {!compact && member.email !== displayName && (
          <div className="text-sm text-gray-500 truncate">
            {member.email}
          </div>
        )}
        {!compact && member.tea_school && (
          <div className="text-sm text-gray-500">
            {member.tea_school}
            {member.tea_school_ja && member.tea_school_ja !== member.tea_school && (
              <span className="ml-1">({member.tea_school_ja})</span>
            )}
          </div>
        )}
        {showBio && !compact && member.bio && (
          <div className="text-sm text-gray-600 mt-1">
            {member.bio}
          </div>
        )}
        {showBio && !compact && member.bio_ja && member.bio_ja !== member.bio && (
          <div className="text-sm text-gray-600 mt-1" lang="ja">
            {member.bio_ja}
          </div>
        )}
      </div>
    </div>
  );

  if (linkToProfile && !compact) {
    return (
      <Link 
        href={`/profile/${member.id}`}
        className="block hover:bg-gray-50 rounded-lg transition-colors"
      >
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}