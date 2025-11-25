"use client";

import { useState } from 'react';
import { SessionDetailDialog } from './session-detail-dialog';
import { SessionCard } from './session-card';
import type { StudySession } from '@/types/study-session';

interface SessionDialogContainerProps {
  sessions: StudySession[];
}

export function SessionDialogContainer({ sessions }: SessionDialogContainerProps) {
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSessionClick = (session: StudySession) => {
    setSelectedSession(session);
    setIsDialogOpen(true);
  };

  const handleSessionUpdate = (updatedSession: StudySession) => {
    setSelectedSession(updatedSession);
  };

  return (
    <>
      {sessions.map((session) => (
        <SessionCard
          key={session._id}
          session={session}
          onShowDetails={handleSessionClick}
        />
      ))}
      <SessionDetailDialog
        session={selectedSession}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSessionUpdate={handleSessionUpdate}
      />
    </>
  );
} 