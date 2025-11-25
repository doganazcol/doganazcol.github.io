'use client';

import { useRouter } from 'next/navigation';
import { JoinSessionButton } from '@/components/join-session-button';

interface JoinSessionButtonWrapperProps {
  sessionId: string;
  isParticipant: boolean;
  isFull: boolean;
  isPrivate: boolean;
  hasPendingRequest: boolean;
}

export function JoinSessionButtonWrapper({
  sessionId,
  isParticipant,
  isFull,
  isPrivate,
  hasPendingRequest
}: JoinSessionButtonWrapperProps) {
  const router = useRouter();
  return (
    <JoinSessionButton
      sessionId={sessionId}
      isParticipant={isParticipant}
      isFull={isFull}
      isPrivate={isPrivate}
      hasPendingRequest={hasPendingRequest}
      onUpdate={() => {
        router.refresh();
      }}
    />
  );
} 