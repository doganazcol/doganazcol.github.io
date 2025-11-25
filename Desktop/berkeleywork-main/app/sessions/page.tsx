import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import { StudySession, User } from '@/lib/db/schema';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { SessionCard } from '@/components/session-card';
import { JoinRequestsDialog } from '@/components/join-requests-dialog';
import { Types } from 'mongoose';
import { SessionsList } from '@/components/sessions-list';

interface MongoUser {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  image?: string;
}

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
  user: {
    _id: string;
    fullName: string;
    email: string;
    image?: string;
  };
  requestedAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface PopulatedSession {
  _id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  participants: Participant[];
  pendingRequests: PendingRequest[];
  isPrivate: boolean;
  createdBy: UserData;
  createdAt: string;
  updatedAt: string;
  class: string;
}

interface RawSession {
  _id: Types.ObjectId;
  title: string;
  description: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  participants: Array<{
    user: Types.ObjectId;
    joinedAt: Date;
  }>;
  pendingRequests: Array<{
    _id: Types.ObjectId;
    user: Types.ObjectId;
    requestedAt: Date;
    status: 'pending' | 'accepted' | 'rejected';
  }>;
  isPrivate: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  class: string;
}

export default async function SessionsPage() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      redirect('/auth/signin');
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      redirect('/auth/signin');
    }

    // Get all sessions with future dates
    const sessions = await StudySession.find({
      date: { 
        $gte: new Date(new Date().setHours(0, 0, 0, 0)) // Start of today
      },
      isDeleted: { $ne: true } // Exclude deleted sessions
    })
      .sort({ date: 1 })
      // Explicitly select necessary fields, including startTime and endTime
      .select('_id title description date startTime endTime location maxParticipants currentParticipants participants pendingRequests isPrivate createdBy class') 
      .lean<RawSession[]>()
      .exec();

    // Get all unique user IDs from participants, pending requests, and creators
    const userIds = new Set<Types.ObjectId>();
    sessions.forEach(session => {
      if (session.participants) {
        session.participants.forEach(p => {
          if (p && p.user) userIds.add(p.user);
        });
      }
      if (session.pendingRequests) {
        session.pendingRequests.forEach(r => {
          if (r && r.user) userIds.add(r.user);
        });
      }
      if (session.createdBy) userIds.add(session.createdBy);
    });

    // Fetch all users in a single query
    const users = await User.find({
      _id: { $in: Array.from(userIds) }
    })
      .lean<MongoUser[]>()
      .select('fullName email image')
      .exec();

    // Create a map for quick user lookups
    const userMap = new Map(users.map(u => [u._id?.toString() || '', u]));

    // Populate sessions with user details
    const populatedSessions = sessions.map(session => {
      if (!session) return null;
      const populatedSession: PopulatedSession = {
        _id: session._id?.toString() || '',
        title: session.title || '',
        description: session.description || '',
        date: session.date?.toISOString() || new Date().toISOString(),
        startTime: session.startTime || '',
        endTime: session.endTime || '',
        location: session.location || '',
        maxParticipants: session.maxParticipants || 0,
        currentParticipants: session.currentParticipants || 0,
        participants: [],
        pendingRequests: [],
        isPrivate: session.isPrivate || false,
        createdBy: {} as UserData,
        createdAt: session.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: session.updatedAt?.toISOString() || new Date().toISOString(),
        class: session.class || ''
      };

      // Populate participants
      if (session.participants?.length > 0) {
        populatedSession.participants = session.participants
          .map(p => {
            if (!p || !p.user) return null;
            const userDoc = userMap.get(p.user.toString());
            return {
              user: {
                _id: p.user.toString(),
                fullName: userDoc?.fullName || 'Unknown User',
                email: userDoc?.email || '',
                image: userDoc?.image,
              },
              joinedAt: p.joinedAt?.toISOString() || new Date().toISOString()
            } as Participant;
          })
          .filter((p): p is Participant => p !== null);
      }

      // Populate pending requests
      if (session.pendingRequests?.length > 0) {
        populatedSession.pendingRequests = session.pendingRequests
          .map(r => {
            if (!r || !r.user) return null;
            const userDoc = userMap.get(r.user.toString());
            return {
              _id: r._id?.toString() || '',
              user: {
                _id: r.user.toString(),
                fullName: userDoc?.fullName || 'Unknown User',
                email: userDoc?.email || '',
                image: userDoc?.image,
              },
              requestedAt: r.requestedAt?.toISOString() || new Date().toISOString(),
              status: r.status || 'pending'
            } as PendingRequest;
          })
          .filter((r): r is PendingRequest => r !== null);
      }

      // Populate creator
      if (session.createdBy) {
        const creator = userMap.get(session.createdBy.toString());
        populatedSession.createdBy = {
          _id: session.createdBy.toString(),
          fullName: creator?.fullName || 'Unknown User',
          email: creator?.email || '',
          image: creator?.image,
        };
      }

      return populatedSession;
    }).filter((s): s is PopulatedSession => s !== null);

    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Study Sessions</h1>
        </div>
        
        <SessionsList sessions={populatedSessions} />
      </div>
    );
  } catch (error) {
    console.error('Error loading sessions:', error);
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Study Sessions</h1>
        <div className="bg-red-50 text-red-500 p-4 rounded-md">
          Failed to load study sessions. Please try again later.
        </div>
      </div>
    );
  }
} 