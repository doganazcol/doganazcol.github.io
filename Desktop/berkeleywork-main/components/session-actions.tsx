'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SessionActionsProps {
  sessionId: string;
  isCreator: boolean;
  isParticipant: boolean;
  showDeleteButton: boolean;
}

export function SessionActions({ 
  sessionId, 
  isCreator, 
  isParticipant,
  showDeleteButton
}: SessionActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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
      router.push('/my-sessions');
    } catch (error) {
      console.error('Failed to leave session:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to leave session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast.success('Session deleted successfully');
      router.push('/my-sessions');
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete session');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isCreator && !isParticipant) {
    return null;
  }

  return (
    <div className="flex gap-2">
      {isParticipant && !isCreator && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={isLoading}>
              Leave Session
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Leave Session</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to leave this study session? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLeave} disabled={isLoading}>
                {isLoading ? 'Leaving...' : 'Leave Session'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {showDeleteButton && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isLoading}>
              Delete Session
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Session</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this study session? This action cannot be undone and all participants will be notified.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
                {isLoading ? 'Deleting...' : 'Delete Session'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
} 