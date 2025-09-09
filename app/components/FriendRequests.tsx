'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Check, X, Clock } from 'lucide-react';
import MemberCard from './MemberCard';

interface FriendRequest {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  requester: {
    id: string;
    full_name_en: string | null;
    full_name_ja: string | null;
    email: string;
    profile_picture_id: string | null;
  };
  recipient: {
    id: string;
    full_name_en: string | null;
    full_name_ja: string | null;
    email: string;
    profile_picture_id: string | null;
  };
}

interface FriendRequestsProps {
  currentUserEmail: string;
}

export default function FriendRequests({ currentUserEmail }: FriendRequestsProps) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadFriendRequests();
  }, [currentUserEmail]);

  const loadFriendRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/friends');
      const result = await response.json();
      
      if (result.ok) {
        // Filter for pending requests where current user is recipient
        const pendingRequests = result.data.filter((req: FriendRequest) => 
          req.status === 'pending'
        );
        setRequests(pendingRequests);
      } else {
        console.error('Failed to load friend requests:', result.error);
      }
    } catch (error) {
      console.error('Error loading friend requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (requestId: string, action: 'accept' | 'decline') => {
    setActionLoading(requestId);
    try {
      const response = await fetch(`/api/friends/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();
      
      if (result.ok) {
        // Remove the request from the list
        setRequests(prev => prev.filter(req => req.id !== requestId));
      } else {
        console.error(`Failed to ${action} friend request:`, result.error);
      }
    } catch (error) {
      console.error(`Error ${action}ing friend request:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  // Separate received and sent requests
  const receivedRequests = requests.filter(req => req.recipient.email === currentUserEmail);
  const sentRequests = requests.filter(req => req.requester.email === currentUserEmail);

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">Loading requests...</p>
      </div>
    );
  }

  if (receivedRequests.length === 0 && sentRequests.length === 0) {
    return (
      <div className="text-center py-4">
        <UserPlus className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p className="text-gray-500">No pending friend requests</p>
        <p className="text-sm text-gray-400 mt-1">
          Connect with other members to build your tea ceremony community
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Received Requests */}
      {receivedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Invitations Received ({receivedRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {receivedRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <MemberCard 
                      member={request.requester}
                      showBio={false}
                      compact={true}
                    />
                    <div className="text-sm text-gray-500">
                      wants to connect
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleRequest(request.id, 'accept')}
                      size="sm"
                      disabled={actionLoading === request.id}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleRequest(request.id, 'decline')}
                      variant="outline"
                      size="sm"
                      disabled={actionLoading === request.id}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sent Requests */}
      {sentRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Invitations Sent ({sentRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sentRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <MemberCard 
                      member={request.recipient}
                      showBio={false}
                      compact={true}
                    />
                    <div className="text-sm text-gray-500">
                      invitation pending
                    </div>
                  </div>
                  <div className="flex items-center text-orange-600">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="text-sm">Pending</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}