"use client"

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface UserData {
  _id: string;
  fullName: string;
  email: string;
  image?: string;
}

interface PendingRequest {
  _id: string;
  user: UserData;
  status: "pending" | "accepted" | "rejected";
  requestedAt: string;
}

interface JoinRequestsDialogProps {
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requests: PendingRequest[];
  onRequestUpdate: () => void;
  sessionTitle: string;
}

export function JoinRequestsDialog({
  sessionId,
  open,
  onOpenChange,
  requests,
  onRequestUpdate,
  sessionTitle,
}: JoinRequestsDialogProps) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [localRequests, setLocalRequests] = useState<PendingRequest[]>(requests);

  useEffect(() => {
    setLocalRequests(requests);
  }, [requests]);

  const handleAccept = async (requestId: string) => {
    setLoadingStates(prev => ({ ...prev, [requestId]: true }));
    try {
      console.log('Accepting request:', requestId);
      const response = await fetch(`/api/sessions/${sessionId}/requests/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'accept' }),
      });

      const data = await response.json();
      console.log('Accept response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept request');
      }

      // Update local state
      setLocalRequests(prevRequests => 
        prevRequests.map(request => 
          request._id === requestId 
            ? { ...request, status: 'accepted' }
            : request
        )
      );

      toast.success('Request accepted successfully');
      onRequestUpdate();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to accept request');
    } finally {
      setLoadingStates(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleReject = async (requestId: string) => {
    setLoadingStates(prev => ({ ...prev, [requestId]: true }));
    try {
      console.log('Rejecting request:', requestId);
      const response = await fetch(`/api/sessions/${sessionId}/requests/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject' }),
      });

      const data = await response.json();
      console.log('Reject response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject request');
      }

      // Update local state
      setLocalRequests(prevRequests => 
        prevRequests.map(request => 
          request._id === requestId 
            ? { ...request, status: 'rejected' }
            : request
        )
      );

      toast.success('Request rejected successfully');
      onRequestUpdate();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject request');
    } finally {
      setLoadingStates(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const pendingRequests = (localRequests || []).filter(r => r.status === 'pending');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto
        data-[state=open]:animate-in data-[state=closed]:animate-out
        data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
        data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
        data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]
        data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
      >
        <DialogHeader className="pb-2">
          <DialogTitle>Join Requests - {sessionTitle}</DialogTitle>
          <DialogDescription>
            Manage requests to join your study session
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          {pendingRequests.length === 0 ? (
            <div className="text-center text-muted-foreground py-2">
              No pending join requests
            </div>
          ) : (
            <div className="space-y-2">
              {pendingRequests.map((request) => (
                <div
                  key={request._id}
                  className="flex items-center justify-between p-3 border rounded-lg
                    transition-all duration-200 ease-in-out
                    hover:bg-accent/5 hover:border-primary/20
                    group"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 transition-transform duration-200 group-hover:scale-110">
                      <AvatarImage src={request.user.image || ""} />
                      <AvatarFallback>
                        {request.user.fullName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm group-hover:text-primary transition-colors">
                        {request.user.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {request.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAccept(request._id)}
                      disabled={loadingStates[request._id]}
                      className="transition-colors duration-200 w-[90px] h-8
                        hover:bg-green-100 dark:hover:bg-green-900/30
                        hover:text-green-700 dark:hover:text-green-300
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingStates[request._id] ? (
                        <span className="flex items-center justify-center gap-1 w-full">
                          <span className="h-3 w-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs whitespace-nowrap">Processing...</span>
                        </span>
                      ) : (
                        "Accept"
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleReject(request._id)}
                      disabled={loadingStates[request._id]}
                      className="transition-colors duration-200 w-[90px] h-8
                        hover:bg-red-100 dark:hover:bg-red-900/30
                        hover:text-red-700 dark:hover:text-red-300
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingStates[request._id] ? (
                        <span className="flex items-center justify-center gap-1 w-full">
                          <span className="h-3 w-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs whitespace-nowrap">Processing...</span>
                        </span>
                      ) : (
                        "Reject"
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 