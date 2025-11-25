"use client"

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { JoinRequestsDialog } from "./join-requests-dialog";
import { CalendarDays, MapPin, Users, Clock, Eye, Loader2, UserX } from "lucide-react";
import { formatTime } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { EditSessionDialog } from "@/components/edit-session-dialog";
import { SessionDetailDialog } from "@/components/session-detail-dialog";
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

interface SessionCardProps {
  session: StudySession;
  onShowDetails: (session: StudySession) => void;
  onUpdate?: (session: StudySession) => void;
}

export function SessionCard({ session, onShowDetails, onUpdate }: SessionCardProps) {
  const { data: sessionData } = useSession();
  const [localSessionData, setLocalSessionData] = useState(session);
  const [showRequests, setShowRequests] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [isDialogClosing, setIsDialogClosing] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    join: false,
    leave: false,
    delete: false,
    cancel: false,
    kick: false
  });

  useEffect(() => {
    setLocalSessionData(session);
  }, [session]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isCreator = sessionData?.user?.email === localSessionData.createdBy?.email || 
    sessionData?.user?.email === "tguliyev@berkeley.edu";

  const isParticipant = sessionData?.user?.email && 
    localSessionData.participants?.some((p) => p?.user?.email === sessionData?.user?.email);

  const hasPendingRequest = sessionData?.user?.email && 
    localSessionData.pendingRequests?.some((r) => r?.user?.email === sessionData?.user?.email && r.status === 'pending');

  const hasAcceptedRequest = sessionData?.user?.email && 
    localSessionData.pendingRequests?.some((r) => r?.user?.email === sessionData?.user?.email && r.status === 'accepted');

  const hasRejectedRequest = sessionData?.user?.email && 
    localSessionData.pendingRequests?.some((r) => r?.user?.email === sessionData?.user?.email && r.status === 'rejected');

  const handleJoin = async () => {
    if (!sessionData?.user) {
      toast.error("Please sign in to join sessions");
      return;
    }
    setLoadingStates(prev => ({ ...prev, join: true }));
    try {
      const response = await fetch(`/api/sessions/${localSessionData._id}/join`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to join session");
      
      if (data.status === "pending") {
        toast.success("Join request sent successfully");
        const updatedSession: StudySession = {
          ...localSessionData,
          pendingRequests: [
            ...localSessionData.pendingRequests,
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
        setLocalSessionData(updatedSession);
        if (onUpdate) {
          onUpdate(updatedSession);
        }
      } else {
        toast.success("Successfully joined session");
        const updatedSession: StudySession = {
          ...localSessionData,
          participants: [
            ...localSessionData.participants,
            {
              user: {
                _id: sessionData.user.id,
                email: sessionData.user.email || '',
                fullName: sessionData.user.name || '',
                image: sessionData.user.image || undefined
              },
              joinedAt: new Date().toISOString()
            }
          ],
          currentParticipants: localSessionData.currentParticipants + 1
        };
        setLocalSessionData(updatedSession);
        if (onUpdate) {
          onUpdate(updatedSession);
        }
      }
      router.refresh();
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
      const response = await fetch(`/api/sessions/${localSessionData._id}/join`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to leave session");
      }

      const data = await response.json();
      toast.success("Successfully left session");
      
      // Update local state
      const updatedSession: StudySession = {
        ...localSessionData,
        participants: localSessionData.participants.filter(
          p => p.user.email !== sessionData.user?.email
        ),
        currentParticipants: localSessionData.currentParticipants - 1
      };
      setLocalSessionData(updatedSession);
      if (onUpdate) {
        onUpdate(updatedSession);
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to leave session");
    } finally {
      setLoadingStates(prev => ({ ...prev, leave: false }));
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
      const response = await fetch(`/api/sessions/${localSessionData._id}`, {
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
      router.refresh();
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete session");
    } finally {
      setLoadingStates(prev => ({ ...prev, delete: false }));
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowEditDialog(true);
    setShowDetailDialog(false);
  };

  const handleEditDialogClose = () => {
    setIsDialogClosing(true);
    setShowEditDialog(false);
    // Reset the closing state after a short delay
    setTimeout(() => {
      setIsDialogClosing(false);
    }, 100);
  };

  const handleDetailDialogClose = () => {
    setShowDetailDialog(false);
  };

  const handleParticipantsDialogClose = () => {
    setIsDialogClosing(true);
    setShowParticipants(false);
    // Reset the closing state after a short delay
    setTimeout(() => {
      setIsDialogClosing(false);
    }, 100);
  };

  const handleRequestsDialogClose = () => {
    setIsDialogClosing(true);
    setShowRequests(false);
    // Reset the closing state after a short delay
    setTimeout(() => {
      setIsDialogClosing(false);
    }, 100);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open session dialog if any dialog is open or if we're in the process of closing one
    if (showEditDialog || showDetailDialog || showParticipants || showRequests || isDialogClosing) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const target = e.target as HTMLElement;
    // Check if the click is on the dialog overlay or any dialog content
    if (target.closest('[role="dialog"]') || 
        target.closest('[data-radix-popper-content-wrapper]') ||
        target.closest('[data-radix-overlay]') ||
        target.closest('.dialog-overlay')) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (!target.closest('.button-container') && 
        !target.closest('.edit-dialog') &&
        !target.closest('button')) {
      e.stopPropagation();
      onShowDetails(localSessionData);
    }
  };

  const creatorFirstName = localSessionData.createdBy?.fullName?.split(' ')[0] || 'Unknown';

  const isPastSession = new Date(localSessionData.date) < new Date();

  const handleCancelRequest = async () => {
    if (!sessionData?.user) return;

    setLoadingStates(prev => ({ ...prev, cancel: true }));
    try {
      const response = await fetch(`/api/sessions/${localSessionData._id}/requests/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel request');
      }

      const data = await response.json();
      const updatedSession = {
        ...localSessionData,
        pendingRequests: data.session.pendingRequests,
      };
      setLocalSessionData(updatedSession);
      
      if (onUpdate) {
        onUpdate(updatedSession);
      }
      
      toast.success("Request cancelled successfully");
      router.refresh();
    } catch (error) {
      console.error('Error canceling request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel request');
    } finally {
      setLoadingStates(prev => ({ ...prev, cancel: false }));
    }
  };

  const handleKickParticipant = async (userId: string) => {
    if (!sessionData?.user) {
      toast.error("Please sign in to kick participants");
      return;
    }
    setLoadingStates(prev => ({ ...prev, kick: true }));
    try {
      const response = await fetch(`/api/sessions/${localSessionData._id}/kick`, {
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
        ...localSessionData,
        participants: localSessionData.participants.filter(
          p => p.user._id !== userId
        ),
        currentParticipants: localSessionData.currentParticipants - 1
      };
      setLocalSessionData(updatedSession);
      if (onUpdate) {
        onUpdate(updatedSession);
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to kick participant");
    } finally {
      setLoadingStates(prev => ({ ...prev, kick: false }));
    }
  };

  return (
    <>
      <div 
        className="border rounded-lg overflow-hidden bg-card flex flex-col h-full cursor-pointer 
          hover:bg-accent/5 transition-all duration-200 ease-in-out
          hover:scale-[1.02] hover:shadow-lg
          dark:hover:bg-accent/10
          active:scale-[0.98]"
        onClick={handleCardClick}
      >
        <div className="p-6 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{localSessionData.title}</h3>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className="bg-primary/10 text-primary border-primary/20 transition-colors"
                >
                  {localSessionData.class}
                </Badge>
                {localSessionData.isPrivate && (
                  <Badge 
                    variant="outline" 
                    className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800/50 transition-colors"
                  >
                    Private
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 transition-colors hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowParticipants(true);
                      }}
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View Participants</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {localSessionData.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {localSessionData.description}
            </p>
          )}

          <div className="space-y-3 text-sm text-muted-foreground mt-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span>{format(parseISO(localSessionData.date), "EEEE, MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{formatTime(localSessionData.startTime)} - {formatTime(localSessionData.endTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{localSessionData.location}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={localSessionData.createdBy?.image} />
                <AvatarFallback>{creatorFirstName[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">Created by {creatorFirstName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className="bg-muted text-muted-foreground transition-colors"
              >
                {localSessionData.currentParticipants}/{localSessionData.maxParticipants} participants
              </Badge>
            </div>
          </div>

          <div className="mt-6 flex gap-2 button-container">
            {isCreator ? (
              <>
                {localSessionData.isPrivate && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 transition-colors hover:bg-primary/10 relative"
                    onClick={() => setShowRequests(true)}
                  >
                    View Requests
                    {localSessionData.pendingRequests?.filter(r => r.status === 'pending').length > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-green-500 text-white hover:bg-green-600"
                      >
                        {localSessionData.pendingRequests.filter(r => r.status === 'pending').length}
                      </Badge>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 transition-colors hover:bg-primary/10"
                  onClick={handleEdit}
                  disabled={isPastSession}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1 transition-colors hover:bg-destructive/90"
                  onClick={handleDelete}
                  disabled={loadingStates.delete}
                >
                  {loadingStates.delete ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </Button>
              </>
            ) : isParticipant ? (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 transition-colors hover:bg-destructive/10 hover:text-destructive"
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
                size="sm"
                className="flex-1 transition-colors hover:bg-destructive/10 hover:text-destructive"
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
                size="sm"
                className="flex-1 transition-colors hover:bg-primary/90"
                onClick={handleJoin}
                disabled={loadingStates.join || localSessionData.currentParticipants >= localSessionData.maxParticipants}
              >
                {loadingStates.join ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  localSessionData.currentParticipants >= localSessionData.maxParticipants ? "Full" : "Request to Join"
                )}
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="flex-1 transition-colors hover:bg-primary/90"
                onClick={handleJoin}
                disabled={loadingStates.join || localSessionData.currentParticipants >= localSessionData.maxParticipants}
              >
                {loadingStates.join ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  localSessionData.currentParticipants >= localSessionData.maxParticipants ? "Full" : 
                  localSessionData.isPrivate ? "Request to Join" : "Join Session"
                )}
              </Button>
            )}
          </div>
        </div>

        <JoinRequestsDialog
          sessionId={localSessionData._id}
          open={showRequests}
          onOpenChange={(open) => {
            if (!open) {
              handleRequestsDialogClose();
            }
          }}
          requests={localSessionData.pendingRequests}
          onRequestUpdate={() => router.refresh()}
          sessionTitle={localSessionData.title}
        />

        {showDetailDialog && (
          <SessionDetailDialog
            session={localSessionData}
            open={showDetailDialog}
            onOpenChange={handleDetailDialogClose}
          />
        )}

        {showEditDialog && (
          <EditSessionDialog
            session={{
              id: localSessionData._id,
              title: localSessionData.title,
              class: localSessionData.class,
              date: new Date(localSessionData.date),
              startTime: localSessionData.startTime,
              endTime: localSessionData.endTime,
              location: localSessionData.location,
              description: localSessionData.description,
              maxParticipants: localSessionData.maxParticipants,
            }}
            open={showEditDialog}
            onOpenChange={(open) => {
              if (!open) {
                handleEditDialogClose();
              }
            }}
          />
        )}

        <Dialog 
          open={showParticipants} 
          onOpenChange={(open) => {
            if (!open) {
              handleParticipantsDialogClose();
            }
          }}
        >
          <DialogContent 
            className="sm:max-w-[425px]"
            onInteractOutside={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleParticipantsDialogClose();
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            onPointerDownOutside={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleParticipantsDialogClose();
            }}
          >
            <DialogHeader>
              <DialogTitle>Session Participants</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {localSessionData.participants?.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No participants yet
                </div>
              ) : (
                <div className="space-y-4">
                  {localSessionData.participants?.map((participant) => (
                    <div
                      key={participant?.user?._id}
                      className="flex items-center justify-between gap-3 p-4 border rounded-lg"
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
                      {isCreator && participant?.user?._id !== sessionData?.user?.id && participant?.user?._id !== localSessionData.createdBy?._id && (
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
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
} 