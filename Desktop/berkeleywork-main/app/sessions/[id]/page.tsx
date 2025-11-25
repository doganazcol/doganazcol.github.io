import { getServerSession } from 'next-auth';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { notFound, redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import { StudySession, User } from '@/lib/db/schema';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { JoinSessionButton } from '@/components/join-session-button';
import { Types } from 'mongoose';
import { SessionActions } from '@/components/session-actions';
import { JoinSessionButtonWrapper } from '@/components/join-session-button-wrapper';

interface Participant {
  user: {
    _id: Types.ObjectId;
    name: string;
    email: string;
  };
}

interface PendingRequest {
  user: {
    _id: Types.ObjectId;
    name: string;
    email: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
}

interface PopulatedSession {
  _id: Types.ObjectId;
  title: string;
  class: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  maxParticipants: number;
  currentParticipants: number;
  createdBy: {
    _id: Types.ObjectId;
    name: string;
    email: string;
  };
  participants: Participant[];
  pendingRequests: PendingRequest[];
  isPrivate: boolean;
}

export default async function SessionPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  await dbConnect();
  
  // Get the current user's MongoDB ID
  const currentUser = await User.findOne({ email: session.user.email });
  if (!currentUser) {
    redirect('/auth/signin');
  }

  const studySession = await StudySession.findById(params.id)
    .populate('participants.user', 'name email')
    .populate('pendingRequests.user', 'name email')
    .populate('createdBy', 'name email')
    .lean<PopulatedSession>();

  if (!studySession) {
    notFound();
  }

  const isCreator = studySession.createdBy._id.toString() === currentUser._id.toString();
  const isParticipant = studySession.participants.some(
    (p: Participant) => p.user._id.toString() === currentUser._id.toString()
  );
  const hasPendingRequest = studySession.pendingRequests.some(
    (r: PendingRequest) => r.user._id.toString() === currentUser._id.toString() && r.status === 'pending'
  );
  const isFull = studySession.currentParticipants >= studySession.maxParticipants;
  
  // Check if user is admin
  const isAdmin = currentUser.email === "tguliyev@berkeley.edu"; // Admin email
  const showDeleteButton = isCreator || isAdmin;

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{studySession.title}</h1>
          <div className="flex gap-2">
            {isCreator && (
              <Link href={`/sessions/${params.id}/edit`}>
                <Button>Edit Session</Button>
              </Link>
            )}
            <SessionActions
              sessionId={params.id}
              isCreator={isCreator}
              isParticipant={isParticipant}
              showDeleteButton={showDeleteButton}
            />
          </div>
        </div>

        <div className="grid gap-6">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(studySession.date), 'MMMM d, yyyy')} {studySession.startTime} - {studySession.endTime}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{studySession.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{studySession.currentParticipants} of {studySession.maxParticipants} students attending</span>
            </div>
          </div>

          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground">{studySession.description}</p>
          </div>

          {!isCreator && !isParticipant && (
            <JoinSessionButtonWrapper
              sessionId={params.id}
              isParticipant={isParticipant}
              isFull={isFull}
              isPrivate={studySession.isPrivate}
              hasPendingRequest={hasPendingRequest}
            />
          )}

          {studySession.participants.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Participants</h2>
              <div className="grid gap-2">
                {studySession.participants.map((participant: Participant) => (
                  <div
                    key={participant.user._id.toString()}
                    className="flex items-center gap-2 p-2 rounded-md bg-muted"
                  >
                    <span className="font-medium">{participant.user.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {participant.user.email}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 