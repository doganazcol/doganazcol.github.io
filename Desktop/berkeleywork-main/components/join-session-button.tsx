'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface JoinSessionButtonProps {
  sessionId: string;
  isParticipant: boolean;
  isFull: boolean;
  isPrivate: boolean;
  hasPendingRequest: boolean;
  onUpdate?: () => void;
}

export function JoinSessionButton({ 
  sessionId, 
  isParticipant, 
  isFull,
  isPrivate,
  hasPendingRequest,
  onUpdate
}: JoinSessionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleJoin = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/sessions/${sessionId}/join`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      if (data.status === 'pending') {
        toast.success('Join request sent successfully');
        if (onUpdate) {
          onUpdate();
        }
      } else if (data.status === 'joined') {
        toast.success('Successfully joined session');
        if (onUpdate) {
          onUpdate();
        }
      }
      router.refresh();
    } catch (error) {
      console.error('Failed to join session:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to join session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/sessions/${sessionId}/join`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast.success('Successfully left session');
      if (onUpdate) {
        onUpdate();
      }
      router.refresh();
    } catch (error) {
      console.error('Failed to leave session:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to leave session');
    } finally {
      setIsLoading(false);
    }
  };

  if (isParticipant) {
    return (
      <Button 
        onClick={handleLeave} 
        disabled={isLoading}
        variant="destructive"
      >
        {isLoading ? 'Leaving...' : 'Leave Session'}
      </Button>
    );
  }

  if (isFull) {
    return (
      <Button disabled>
        Session Full
      </Button>
    );
  }

  if (hasPendingRequest) {
    return (
      <Button disabled>
        Request Pending
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleJoin} 
      disabled={isLoading}
    >
      {isLoading ? 'Joining...' : isPrivate ? 'Request to Join' : 'Join Session'}
    </Button>
  );
} 