'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, CheckCircle, XCircle, Clock } from 'lucide-react';
import MemberCard from './MemberCard';

interface Member {
  id: string;
  full_name_en: string | null;
  full_name_ja: string | null;
  email: string;
  profile_picture_id: string | null;
}

interface FriendStatus {
  [key: string]: 'none' | 'pending_sent' | 'pending_received' | 'friends';
}

interface MemberDiscoveryProps {
  initialMembers: Member[];
  currentUserEmail: string | null;
  title?: string;
  showTitle?: boolean;
}

export default function MemberDiscovery({ 
  initialMembers, 
  currentUserEmail, 
  title = "Discover Members",
  showTitle = true
}: MemberDiscoveryProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [friendStatuses, setFriendStatuses] = useState<FriendStatus>({});
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter out current user
  const otherMembers = members.filter(m => m.email !== currentUserEmail);

  useEffect(() => {
    loadFriendStatuses();
  }, [currentUserEmail]);

  const loadFriendStatuses = async () => {
    if (!currentUserEmail) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/friends');
      const result = await response.json();
      
      if (result.ok) {
        const statuses: FriendStatus = {};
        result.data.forEach((friendship: any) => {
          const otherUserId = friendship.requester_id === result.currentUserId 
            ? friendship.recipient_id 
            : friendship.requester_id;
          
          if (friendship.status === 'accepted') {
            statuses[otherUserId] = 'friends';
          } else if (friendship.status === 'pending') {
            statuses[otherUserId] = friendship.requester_id === result.currentUserId 
              ? 'pending_sent' 
              : 'pending_received';
          }
        });
        setFriendStatuses(statuses);
      }
    } catch (error) {
      console.error('Failed to load friend statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (recipientId: string) => {
    setActionLoading(recipientId);
    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipient_id: recipientId }),
      });

      const result = await response.json();
      
      if (result.ok) {
        setFriendStatuses(prev => ({
          ...prev,
          [recipientId]: 'pending_sent'
        }));
      } else {
        console.error('Failed to send friend request:', result.error);
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const renderActionButton = (member: Member) => {
    const status = friendStatuses[member.id] || 'none';
    const isCurrentUserLoading = actionLoading === member.id;

    switch (status) {
      case 'friends':
        return (
          <Button variant="outline" size="sm" disabled className="text-green-600">
            <CheckCircle className="h-4 w-4 mr-1" />
            Friends
          </Button>
        );
      case 'pending_sent':
        return (
          <Button variant="outline" size="sm" disabled className="text-orange-600">
            <Clock className="h-4 w-4 mr-1" />
            Pending
          </Button>
        );
      case 'pending_received':
        return (
          <Button variant="outline" size="sm" disabled className="text-blue-600">
            <Clock className="h-4 w-4 mr-1" />
            Invited You
          </Button>
        );
      default:
        return (
          <Button 
            onClick={() => sendFriendRequest(member.id)}
            size="sm"
            disabled={isCurrentUserLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            {isCurrentUserLoading ? 'Sending...' : 'Connect'}
          </Button>
        );
    }
  };

  if (!currentUserEmail) {
    return null;
  }

  const content = (
    <div>
      {loading ? (
        <div className="text-center py-4">
          <p className="text-gray-500">Loading connections...</p>
        </div>
      ) : otherMembers.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500">No other members found</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {otherMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
              <MemberCard 
                member={member}
                showBio={false}
                compact={true}
              />
              {renderActionButton(member)}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (!showTitle) {
    return content;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}