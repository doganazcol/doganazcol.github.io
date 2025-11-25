"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { CalendarDays, Edit, GraduationCap, MapPin, Trash, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Types } from "mongoose"
import { formatTime } from "@/lib/utils"
import { SessionCard } from "@/components/session-card"
import { SessionDetailDialog } from "@/components/session-detail-dialog"

interface StudySession {
  _id: string;
  title: string;
  class: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  maxParticipants: number;
  currentParticipants: number;
  participants: Array<{
    user: {
      _id: string;
      fullName: string;
      email: string;
      image?: string;
    };
    joinedAt: string;
  }>;
  pendingRequests: Array<{
    _id: string;
    user: {
      _id: string;
      fullName: string;
      email: string;
      image?: string;
    };
    requestedAt: string;
    status: 'pending' | 'accepted' | 'rejected';
  }>;
  isPrivate: boolean;
  createdBy: {
    _id: string;
    fullName: string;
    email: string;
    image?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface MySessionsContentProps {
  createdSessions: StudySession[];
  joinedSessions: StudySession[];
}

export function MySessionsContent({ createdSessions, joinedSessions }: MySessionsContentProps) {
  const [activeTab, setActiveTab] = useState("created");
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sessions, setSessions] = useState({
    created: createdSessions,
    joined: joinedSessions
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<StudySession | null>(null);
  const [showSessionDialog, setShowSessionDialog] = useState(false);

  const handleSessionClick = (session: StudySession) => {
    setSelectedSession(session);
    setIsDialogOpen(true);
  };

  const handleSessionUpdate = (updatedSession: StudySession) => {
    setSessions(prev => ({
      ...prev,
      created: prev.created.map(s => 
        s._id === updatedSession._id ? updatedSession : s
      ),
      joined: prev.joined.map(s => 
        s._id === updatedSession._id ? updatedSession : s
      )
    }));
    setSelectedSession(updatedSession);
  };

  const handleDeleteClick = (session: StudySession) => {
    setSessionToDelete(session)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) {
      toast.error('No session selected for deletion');
      setShowDeleteDialog(false);
      return;
    }

    try {
      const response = await fetch(`/api/study-sessions/${sessionToDelete._id.toString()}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const text = await response.text();
        const errorMessage = text ? JSON.parse(text)?.error || response.statusText : response.statusText;
        throw new Error(errorMessage || 'Failed to delete session');
      }

      setSessions(prev => ({
        created: prev.created.filter(s => s._id.toString() !== sessionToDelete._id.toString()),
        joined: prev.joined.filter(s => s._id.toString() !== sessionToDelete._id.toString())
      }));
      toast.success('Session deleted successfully');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete session');
    } finally {
      setShowDeleteDialog(false);
      setSessionToDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="created">Created Sessions</TabsTrigger>
          <TabsTrigger value="joined">Joined Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="created">
          {sessions.created.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sessions.created.map((session) => (
                <SessionCard 
                  key={session._id.toString()} 
                  session={{
                    ...session,
                    _id: session._id.toString(),
                  }}
                  onShowDetails={handleSessionClick}
                  onUpdate={handleSessionUpdate}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <CalendarDays className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No sessions created yet</h3>
              <p className="text-muted-foreground mt-1 mb-4 max-w-md">
                You haven't created any study sessions yet. Create one to start studying with others!
              </p>
              <Button asChild>
                <Link href="/sessions/new">Create Session</Link>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="joined">
          {sessions.joined.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sessions.joined.map((session) => (
                <SessionCard 
                  key={session._id.toString()} 
                  session={{
                    ...session,
                    _id: session._id.toString(),
                  }}
                  onShowDetails={handleSessionClick}
                  onUpdate={handleSessionUpdate}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <CalendarDays className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No sessions joined yet</h3>
              <p className="text-muted-foreground mt-1 mb-4 max-w-md">
                You haven't joined any study sessions yet. Browse available sessions to find one that matches your needs!
              </p>
              <Button asChild>
                <Link href="/sessions">Browse Sessions</Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the study session and remove all participants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SessionDetailDialog
        session={selectedSession}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSessionUpdate={handleSessionUpdate}
      />
    </div>
  );
} 