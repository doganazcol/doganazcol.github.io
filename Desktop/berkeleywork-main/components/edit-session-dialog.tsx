"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditSessionForm } from "@/components/edit-session-form";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EditSessionDialogProps {
  session: {
    id: string;
    title: string;
    class: string;
    date: Date;
    startTime: string;
    endTime: string;
    location: string;
    description: string;
    maxParticipants: number;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionUpdate?: () => void;
  className?: string;
}

export function EditSessionDialog({ session, open, onOpenChange, onSessionUpdate, className }: EditSessionDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSuccess = () => {
    toast.success("Session updated successfully");
    if (onSessionUpdate) {
      onSessionUpdate();
    }
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        onOpenChange(false);
      }
    }}>
      <DialogContent className={cn("sm:max-w-[1200px] max-h-[90vh] overflow-hidden flex flex-col px-16 py-8", className)}>
        <DialogHeader>
          <DialogTitle>Edit Study Session</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-6">
          <div className="px-4">
            <EditSessionForm 
              session={session} 
              onSuccess={handleSuccess}
              onCancel={() => onOpenChange(false)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 