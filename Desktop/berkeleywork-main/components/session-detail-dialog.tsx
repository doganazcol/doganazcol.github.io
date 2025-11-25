"use client"

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from 'date-fns'
import { CalendarDays, Clock, MapPin, Users, User, Tag, Apple, Loader2, UserX } from 'lucide-react'
import Link from "next/link";
import { formatTime } from "@/lib/utils";
import { CalendarIntegration } from "./calendar-integration";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { JoinRequestsDialog } from "./join-requests-dialog";
import { EditSessionDialog } from "@/components/edit-session-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { StudySession } from "@/types/study-session";

interface UserData {
  _id: string;
  fullName: string;
  email: string;
  image?: string;
}

interface Participant {
  user: UserData;
  joinedAt: string;
}

interface PendingRequest {
  _id: string;
  user: UserData;
  requestedAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface SessionDetailDialogProps {
  session: StudySession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionUpdate?: (updatedSession: StudySession) => void;
}

export function SessionDetailDialog({ session, open, onOpenChange, onSessionUpdate }: SessionDetailDialogProps) {
  const { data: sessionData } = useSession();
  const [loadingStates, setLoadingStates] = useState({
    join: false,
    leave: false,
    delete: false,
    cancel: false,
    kick: false
  });
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentSession, setCurrentSession] = useState<StudySession | null>(session);

  useEffect(() => {
    // Update local state when session prop changes
    if (session) {
      setCurrentSession(session);
    }
  }, [session]);

  useEffect(() => {
    // Fetch latest session data when dialog is opened or when session updates
    if (open && session?._id) {
      fetchSessionDetails();
    }
  }, [open, session?._id, session]);

  const fetchSessionDetails = async () => {
    if (!session) return;
    try {
      const response = await fetch(`/api/sessions/${session._id}`);
      if (!response.ok) throw new Error('Failed to fetch session details');
      const data = await response.json();
      setCurrentSession(data);
      onSessionUpdate?.(data);
    } catch (error) {
      console.error('Error fetching session details:', error);
      toast.error('Failed to load session details');
    }
  };

  // Add a function to refresh session data
  const refreshSessionData = async () => {
    await fetchSessionDetails();
  };

  if (!currentSession) return null;

  const isCreator = sessionData?.user?.email === currentSession.createdBy?.email || 
    sessionData?.user?.email === "tguliyev@berkeley.edu";

  const isParticipant = sessionData?.user?.email && 
    currentSession.participants?.some((p) => p?.user?.email === sessionData?.user?.email);

  const hasPendingRequest = sessionData?.user?.email && 
    currentSession.pendingRequests?.some((r) => r?.user?.email === sessionData?.user?.email && r.status === 'pending');

  const hasRejectedRequest = sessionData?.user?.email && 
    currentSession.pendingRequests?.some((r) => r?.user?.email === sessionData?.user?.email && r.status === 'rejected');

  const isFull = currentSession.currentParticipants >= currentSession.maxParticipants;

  // Check if the session is in the past
  const isPastSession = new Date(currentSession.date) < new Date();

  const handleJoin = async () => {
    if (!sessionData?.user) {
      toast.error("Please sign in to join sessions");
      return;
    }
    setLoadingStates(prev => ({ ...prev, join: true }));
    try {
      const response = await fetch(`/api/sessions/${currentSession._id}/join`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to join session");
      
      if (data.status === "pending") {
        toast.success("Join request sent successfully");
        const updatedSession: StudySession = {
          ...currentSession,
          pendingRequests: [
            ...currentSession.pendingRequests,
            {
              _id: data.requestId,
              user: {
                _id: sessionData.user.id,
                email: sessionData.user.email || '',
                fullName: sessionData.user.name || '',
                image: sessionData.user.image || undefined
              },
              requestedAt: new Date().toISOString(),
              status: 'pending' as const
            }
          ]
        };
        setCurrentSession(updatedSession);
        onSessionUpdate?.(updatedSession);
      } else {
        toast.success("Successfully joined session");
        await fetchSessionDetails();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to join session");
    } finally {
      setLoadingStates(prev => ({ ...prev, join: false }));
    }
  };

  const handleLeave = async () => {
    if (!sessionData?.user) {
      toast.error("Please sign in to leave sessions");
      return;
    }
    setLoadingStates(prev => ({ ...prev, leave: true }));
    try {
      const response = await fetch(`/api/sessions/${currentSession._id}/join`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to leave session");
      }
      toast.success("Successfully left session");
      await fetchSessionDetails();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to leave session");
    } finally {
      setLoadingStates(prev => ({ ...prev, leave: false }));
    }
  };

  const handleCancelRequest = async () => {
    if (!sessionData?.user) return;
    setLoadingStates(prev => ({ ...prev, cancel: true }));
    try {
      const response = await fetch(`/api/sessions/${currentSession._id}/requests/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel request');
      }

      await response.json();
      await fetchSessionDetails();
      toast.success("Request cancelled successfully");
    } catch (error) {
      console.error('Error canceling request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel request');
    } finally {
      setLoadingStates(prev => ({ ...prev, cancel: false }));
    }
  };

  const handleDelete = async () => {
    if (!sessionData?.user) {
      toast.error("Please sign in to delete sessions");
      return;
    }

    if (!confirm("Are you sure you want to delete this session? This action cannot be undone.")) {
      return;
    }

    setLoadingStates(prev => ({ ...prev, delete: true }));
    try {
      const response = await fetch(`/api/sessions/${currentSession._id}`, {
        method: "DELETE",
      });

      let errorMessage = "Failed to delete session";
      let data;
      
      try {
        data = await response.json();
        if (data?.error) {
          errorMessage = data.error;
        }
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }

      if (!response.ok) {
        throw new Error(errorMessage);
      }

      toast.success("Session deleted successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete session");
    } finally {
      setLoadingStates(prev => ({ ...prev, delete: false }));
    }
  };

  const formattedDate = format(new Date(currentSession.date), 'PPP');

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleEditDialogClose = () => {
    setShowEditDialog(false);
  };

  const handleSessionUpdate = (updatedSession: StudySession) => {
    setCurrentSession(updatedSession);
    onSessionUpdate?.(updatedSession);
  };

  const handleKickParticipant = async (userId: string) => {
    if (!sessionData?.user) {
      toast.error("Please sign in to kick participants");
      return;
    }
    setLoadingStates(prev => ({ ...prev, kick: true }));
    try {
      const response = await fetch(`/api/sessions/${currentSession._id}/kick`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to kick participant");
      }

      const data = await response.json();
      toast.success("Participant kicked successfully");
      
      // Update local state
      const updatedSession: StudySession = {
        ...currentSession,
        participants: currentSession.participants.filter(
          p => p.user._id !== userId
        ),
        currentParticipants: currentSession.currentParticipants - 1
      };
      setCurrentSession(updatedSession);
      onSessionUpdate?.(updatedSession);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to kick participant");
    } finally {
      setLoadingStates(prev => ({ ...prev, kick: false }));
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{currentSession.title}</DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-muted hover:bg-muted/80">
                {currentSession.class}
              </Badge>
              {isPastSession && (
                <Badge variant="secondary">Past Session</Badge>
              )}
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-8 py-4">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="font-medium">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                    {currentSession.description}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center text-sm">
                    <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{formatTime(currentSession.startTime)} - {formatTime(currentSession.endTime)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{currentSession.location}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{currentSession.currentParticipants}/{currentSession.maxParticipants} participants</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Created By</h4>
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src={currentSession.createdBy?.image} />
                      <AvatarFallback>
                        {currentSession.createdBy?.fullName?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{currentSession.createdBy?.fullName}</p>
                      <p className="text-xs text-muted-foreground">{currentSession.createdBy?.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Participants</h4>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {!currentSession.participants || currentSession.participants.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No participants yet</p>
                  ) : (
                    <div className="space-y-3">
                      {currentSession.participants.map((participant, index) => (
                        <div
                          key={participant?.user?._id || `participant-${index}`}
                          className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={participant?.user?.image} />
                              <AvatarFallback>
                                {participant?.user?.fullName?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{participant?.user?.fullName}</p>
                              <p className="text-sm text-muted-foreground">
                                {participant?.user?.email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Joined {format(new Date(participant?.joinedAt), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                          {isCreator && participant?.user?._id !== sessionData?.user?.id && participant?.user?._id !== currentSession.createdBy?._id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleKickParticipant(participant.user._id)}
                              disabled={loadingStates.kick}
                            >
                              {loadingStates.kick ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <UserX className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 flex-wrap justify-between w-full">
              <div className="flex items-center gap-2">
                {isCreator && !isPastSession && (
                <>
                    <Button
                      variant="outline"
                      onClick={handleEdit}
                    >
                    Edit Session
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={loadingStates.delete}
                  >
                    {loadingStates.delete ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Delete Session"
                    )}
                  </Button>
                </>
                )}
                {!isCreator && (
                <>
                  {isParticipant ? (
                    <Button
                      variant="outline"
                      onClick={handleLeave}
                      disabled={loadingStates.leave}
                    >
                      {loadingStates.leave ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Leave Session"
                      )}
                    </Button>
                  ) : hasPendingRequest ? (
                    <Button
                      variant="outline"
                      onClick={handleCancelRequest}
                      disabled={loadingStates.cancel}
                    >
                      {loadingStates.cancel ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Cancel Request"
                      )}
                    </Button>
                  ) : hasRejectedRequest ? (
                    <Button
                      variant="default"
                      onClick={handleJoin}
                      disabled={loadingStates.join || isFull}
                    >
                      {loadingStates.join ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        isFull ? "Session Full" : "Request to Join"
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleJoin}
                      disabled={loadingStates.join || isFull}
                    >
                      {loadingStates.join ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        isFull ? "Session Full" : currentSession.isPrivate ? "Request to Join" : "Join Session"
                      )}
                    </Button>
                  )}
                </>
              )}
              </div>
              <div className="flex items-center gap-2">
                {isCreator && !isPastSession && currentSession.isPrivate && (
                  <Button
                    variant="outline"
                    onClick={() => setShowJoinRequests(true)}
                    className="relative"
                  >
                    View Requests
                    {currentSession.pendingRequests?.filter(r => r.status === 'pending').length > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-green-500 text-white hover:bg-green-600"
                      >
                        {currentSession.pendingRequests.filter(r => r.status === 'pending').length}
                      </Badge>
                    )}
                  </Button>
                )}
                {!isPastSession && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Add to Calendar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(currentSession.title)}&details=${encodeURIComponent(currentSession.description)}&location=${encodeURIComponent(currentSession.location)}&dates=${format(new Date(currentSession.date), 'yyyyMMdd')}T${currentSession.startTime.replace(':', '')}00/${format(new Date(currentSession.date), 'yyyyMMdd')}T${currentSession.endTime.replace(':', '')}00`;
                      window.open(gcalUrl, '_blank');
                    }}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Google Calendar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const appleCalUrl = `data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ADTSTART:${format(new Date(currentSession.date), 'yyyyMMdd')}T${currentSession.startTime.replace(':', '')}00%0ADTEND:${format(new Date(currentSession.date), 'yyyyMMdd')}T${currentSession.endTime.replace(':', '')}00%0ASUMMARY:${encodeURIComponent(currentSession.title)}%0ADESCRIPTION:${encodeURIComponent(currentSession.description)}%0ALOCATION:${encodeURIComponent(currentSession.location)}%0AEND:VEVENT%0AEND:VCALENDAR`;
                      window.open(appleCalUrl, '_blank');
                    }}
                  >
                    <Apple className="mr-2 h-4 w-4" />
                    Apple Calendar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!isPastSession && (
        <>
      <JoinRequestsDialog
        sessionId={currentSession._id}
        open={showJoinRequests}
        onOpenChange={setShowJoinRequests}
        requests={currentSession.pendingRequests}
        onRequestUpdate={() => {
          fetchSessionDetails();
          onSessionUpdate?.(currentSession);
        }}
        sessionTitle={currentSession.title}
      />
        <EditSessionDialog
          session={{
            id: currentSession._id,
            title: currentSession.title,
            class: currentSession.class,
            date: new Date(currentSession.date),
            startTime: currentSession.startTime,
            endTime: currentSession.endTime,
            location: currentSession.location,
            description: currentSession.description,
            maxParticipants: currentSession.maxParticipants,
          }}
          open={showEditDialog}
          onOpenChange={handleEditDialogClose}
          onSessionUpdate={() => {
            fetchSessionDetails();
          }}
        />
        </>
      )}
    </>
  );
} 