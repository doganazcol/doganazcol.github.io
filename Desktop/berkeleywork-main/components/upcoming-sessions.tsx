import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { CalendarDays, MapPin, Users } from "lucide-react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import dbConnect from "@/lib/db"
import { StudySession, User } from "@/lib/db/schema"
import { format } from "date-fns"
import { Types } from "mongoose"

interface SessionUser {
  _id: Types.ObjectId
  name: string
  email: string
  image?: string
}

interface SessionData {
  _id: Types.ObjectId
  title: string
  class: string
  date: Date
  location: string
  currentParticipants: number
  createdBy: SessionUser
}

/**
 * UpcomingSessions Component
 * 
 * Displays a list of upcoming study sessions with details including:
 * - Session title and class
 * - Date and time
 * - Location
 * - Number of attendees
 * - Session creator information
 * - Whether the user created or joined the session
 * 
 * The component is responsive and adapts its layout for different screen sizes.
 */
export async function UpcomingSessions() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return null
  }

  await dbConnect()
  
  // Get the user's ID
  const user = await User.findOne({ email: session.user.email })
  if (!user) {
    return null
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get sessions created by the user
  const createdSessions = await StudySession.find({
    date: { $gte: today },
    createdBy: user._id
  })
  .sort({ date: 1 })
  .populate('createdBy', 'name email image')
  .lean<SessionData[]>()

  // Get sessions where the user is a participant
  const joinedSessions = await StudySession.find({
    date: { $gte: today },
    'participants.user': user._id
  })
  .sort({ date: 1 })
  .populate('createdBy', 'name email image')
  .lean<SessionData[]>()

  // Combine and sort all sessions by date
  const allSessions = [...createdSessions, ...joinedSessions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  return (
    <div className="space-y-4">
      {allSessions.map((session) => (
        <div key={session._id.toString()} className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-md text-sm font-medium">
                {session.class}
              </div>
              <div className="text-sm text-muted-foreground ml-auto sm:hidden">
                {format(new Date(session.date), 'MMM d, h:mm a')}
              </div>
              <div className="text-xs bg-muted px-2 py-0.5 rounded">
                {session.createdBy._id.toString() === user._id.toString() ? 'Created by you' : 'Joined'}
              </div>
            </div>
            <h3 className="font-medium">{session.title}</h3>
            <div className="grid gap-1 mt-2">
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="hidden sm:inline">{format(new Date(session.date), 'MMM d, h:mm a')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{session.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{session.currentParticipants} students attending</span>
              </div>
            </div>
          </div>
          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={session.createdBy.image} alt={session.createdBy.name} />
                <AvatarFallback>{session.createdBy.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{session.createdBy.name}</span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={`/sessions/${session._id}`}>View Details</a>
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

