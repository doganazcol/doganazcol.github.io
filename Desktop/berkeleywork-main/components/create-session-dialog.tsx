"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CreateSessionForm } from "./create-session-form";

interface CreateSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateSessionDialog({ open, onOpenChange }: CreateSessionDialogProps) {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a Study Session</DialogTitle>
          <DialogDescription>
            Set up a study session for your class. Fill out the details below.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <CreateSessionForm />
        </div>
      </DialogContent>
    </Dialog>
  )
}

