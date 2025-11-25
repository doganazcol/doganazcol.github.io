"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CalendarDays, MapPin, Users } from "lucide-react"
import { CalendarIntegration } from "./calendar-integration"
import { format } from "date-fns"

interface SessionDetailsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: {
    _id: string
    title: string
    class: string
    date: string
    startTime: string
    endTime: string
    location: string
    description: string
    maxParticipants: number
    currentParticipants: number
    participants: Array<{
      user: {
        _id: string
        fullName: string
        email: string
        image?: string
      }
      joinedAt: string
    }>
    createdBy: {
      _id: string
      fullName: string
      email: string
      image?: string
    }
  } | null
}

export function SessionDetails({ open, onOpenChange, session }: SessionDetailsProps) {
  if (!session) {
    return null
  }

  const formattedDate = format(new Date(session.date), 'EEEE, MMMM d, yyyy')
  const timeRange = `${session.startTime} - ${session.endTime}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-md text-sm font-medium w-fit">
            {session.class}
          </div>
          <DialogTitle className="mt-2">{session.title}</DialogTitle>
          <DialogDescription>Created by {session.createdBy.fullName}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span>{formattedDate}, {timeRange}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{session.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>
                {session.currentParticipants} of {session.maxParticipants} students attending
              </span>
            </div>
          </div>
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Description</h4>
            <p className="text-sm text-muted-foreground">{session.description}</p>
          </div>
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Attendees</h4>
            <div className="flex flex-wrap gap-2">
              {session.participants.map((participant) => (
                <div key={participant.user._id} className="flex items-center gap-2 bg-muted rounded-full px-3 py-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={participant.user.image} alt={participant.user.fullName} />
                    <AvatarFallback>{participant.user.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{participant.user.fullName}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Add to Calendar</h4>
            <CalendarIntegration
              title={session.title}
              description={session.description}
              startTime={session.startTime}
              endTime={session.endTime}
              location={session.location}
              date={session.date}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button>Join Session</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

