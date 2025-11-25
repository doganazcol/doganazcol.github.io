import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Link from "next/link";
import { CalendarDays, Clock, Users, MapPin } from "lucide-react";
import { format, addDays, isWithinInterval } from 'date-fns';
import { Types } from 'mongoose';
import { useState } from 'react';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SessionCard } from '@/components/session-card';
import { RankBadge } from '@/components/rank-badge';
import { getUserRank, ranks, getNextRank, getRankProgress } from '@/lib/ranks';
import dbConnect from '@/lib/db';
import { StudySession as StudySessionModel } from '@/models/StudySession';
import type { StudySession } from '@/types/study-session';
import User from '@/models/User';
import { ObjectId } from "mongodb";
import { SessionDetailDialog } from '@/components/session-detail-dialog';
import { SessionDialogContainer } from '@/components/session-dialog-container';

interface UserType {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  image?: string;
}

interface PopulatedSession {
  _id: Types.ObjectId;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  participants: Array<{
    user: UserType;
    joinedAt: string;
  }>;
  pendingRequests: Array<{
    _id: Types.ObjectId;
    user: UserType;
    requestedAt: string;
    status: 'pending' | 'accepted' | 'rejected';
  }>;
  isPrivate: boolean;
  createdBy: UserType;
  createdAt: string;
  updatedAt: string;
  class: string;
}

interface Participant {
  user: UserType;
  joinedAt: string;
}

interface PendingRequest {
  _id: Types.ObjectId;
  user: UserType;
  status: 'pending' | 'accepted' | 'rejected';
  requestedAt: string;
}

// Add this helper function to map the server-side data to the expected type
const mapToStudySession = (session: PopulatedSession): StudySession => ({
  _id: session._id.toString(),
  title: session.title,
  description: session.description,
  date: session.date,
  startTime: session.startTime,
  endTime: session.endTime,
  location: session.location,
  maxParticipants: session.maxParticipants,
  currentParticipants: session.currentParticipants,
  participants: session.participants.map((p) => ({
    user: {
      _id: p.user._id.toString(),
      fullName: p.user.fullName || 'Unknown User',
      email: p.user.email || '',
      image: p.user.image
    },
    joinedAt: p.joinedAt
  })),
  pendingRequests: session.pendingRequests.map((r) => ({
    _id: r._id.toString(),
    user: {
      _id: r.user._id.toString(),
      fullName: r.user.fullName || 'Unknown User',
      email: r.user.email || '',
      image: r.user.image
    },
    requestedAt: r.requestedAt,
    status: r.status
  })),
  isPrivate: session.isPrivate,
  createdBy: {
    _id: session.createdBy._id.toString(),
    fullName: session.createdBy.fullName || 'Unknown User',
    email: session.createdBy.email || '',
    image: session.createdBy.image
  },
  createdAt: session.createdAt,
  updatedAt: session.updatedAt,
  class: session.class
});

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  await dbConnect();

  // First, get the user's ID
  const currentUser = await User.findOne({ email: session.user.email })
    .select('_id fullName email image')
    .lean<UserType>();

  if (!currentUser) {
    redirect('/auth/signin');
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const availableSessions = await StudySessionModel.find({
    date: { $gte: today }
  })
    .populate('createdBy', 'fullName email image')
    .populate('participants.user', 'fullName email image')
    .populate('pendingRequests.user', 'fullName email image')
  .exec();

  const userUpcomingSessions = await StudySessionModel.find({
    date: { $gte: today },
    $or: [
      { createdBy: currentUser._id },
      { 'participants.user': currentUser._id }
    ]
  })
    .populate('createdBy', 'fullName email image')
    .populate('participants.user', 'fullName email image')
    .populate('pendingRequests.user', 'fullName email image')
  .exec();

  // Get sessions where the user is a participant (both past and future)
  const participatedSessions = await StudySessionModel.find({
    'participants.user': currentUser._id,
  })
    .populate('createdBy', 'fullName email image')
    .populate('participants.user', 'fullName email image')
    .populate('pendingRequests.user', 'fullName email image')
  .exec();

  // Calculate total completed sessions
  const completedSessions = participatedSessions.filter(session => {
    const sessionDate = new Date(session.date);
    return sessionDate < today;
  }).length;

  // Calculate total sessions (both completed and upcoming)
  const totalSessions = participatedSessions.length;

  // Calculate this week's sessions
  const thisWeekSessions = userUpcomingSessions.filter(session => {
    const sessionDate = new Date(session.date);
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    weekEnd.setHours(23, 59, 59, 999);
    return sessionDate >= weekStart && sessionDate <= weekEnd;
  }).length;

  // Calculate sessions joined
  const sessionsJoined = participatedSessions.length;

  // Calculate total study hours
  const totalStudyHours = participatedSessions.reduce((total, session) => {
    if (!session.startTime || !session.endTime) return total;
    
    try {
    const startTime = new Date(`1970-01-01T${session.startTime}`);
    const endTime = new Date(`1970-01-01T${session.endTime}`);
      
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return total;
      
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    return total + duration;
    } catch (error) {
      return total;
    }
  }, 0);

  // Get user's rank and progress
  const currentRank = getUserRank(totalSessions);
  const nextRank = getNextRank(totalSessions);
  const rankProgress = getRankProgress(totalSessions);

  // Create a map for quick user lookups
  const userMap = new Map<string, UserType>();

  // Populate the sessions with user data
  const populatedSessions = availableSessions.map(session => {
    if (!session) return null;

    const populatedSession: PopulatedSession = {
      _id: session._id,
      title: session.title,
      description: session.description,
      date: session.date.toISOString(),
      startTime: session.startTime,
      endTime: session.endTime,
      location: session.location,
      maxParticipants: session.maxParticipants,
      currentParticipants: session.currentParticipants,
      participants: (session.participants || [])
        .map((participant: any) => {
          if (!participant || !participant.user) return null;
          return {
            user: {
              _id: participant.user._id,
              fullName: participant.user.fullName || 'Unknown User',
              email: participant.user.email || '',
              image: participant.user.image,
            },
            joinedAt: participant.joinedAt.toISOString(),
          };
        })
        .filter((p: Participant | null): p is Participant => p !== null),
      pendingRequests: (session.pendingRequests || [])
        .map((request: any) => {
          if (!request || !request.user) return null;
          return {
            _id: request._id,
            user: {
              _id: request.user._id,
              fullName: request.user.fullName || 'Unknown User',
              email: request.user.email || '',
              image: request.user.image,
            },
            status: (request.status || 'pending') as 'pending' | 'accepted' | 'rejected',
            requestedAt: request.requestedAt.toISOString(),
          };
        })
        .filter((r: PendingRequest | null): r is PendingRequest => r !== null),
      isPrivate: session.isPrivate || false,
      createdBy: {
        _id: session.createdBy._id,
        fullName: session.createdBy.fullName || 'Unknown User',
        email: session.createdBy.email || '',
        image: session.createdBy.image,
      },
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      class: session.class,
    };
    return populatedSession;
  }).filter(Boolean) as PopulatedSession[];

  // Map the populated sessions to the correct type
  const mappedSessions = populatedSessions.map(mapToStudySession);

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="container py-10">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome back, {session.user.name?.split(' ')[0]}!</h1>
              <p className="text-muted-foreground mt-2">Find study sessions for your classes or create your own.</p>
            </div>
          </div>
        </section>
        <section className="container py-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Your study activity overview</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="border-b pb-4">
                  <RankBadge 
                    rank={currentRank}
                    sessionsCount={totalSessions}
                    nextRank={nextRank}
                    progress={rankProgress}
                  />
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    {currentRank.description}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium leading-none">This Week's Sessions</p>
                    <p className="text-2xl font-bold">{thisWeekSessions}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium leading-none">Total Sessions</p>
                    <p className="text-2xl font-bold">{totalSessions}</p>
                    <p className="text-xs text-muted-foreground">({completedSessions} completed)</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium leading-none">Study Hours</p>
                    <p className="text-2xl font-bold">{totalStudyHours.toFixed(1)}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle>Your Upcoming Sessions</CardTitle>
                <CardDescription>Sessions you've created or joined</CardDescription>
              </CardHeader>
              <CardContent>
                {userUpcomingSessions.length === 0 ? (
                  <p className="text-muted-foreground">No upcoming sessions. Why not create one?</p>
                ) : (
                  <div className="space-y-4">
                    {userUpcomingSessions.map((session) => (
                      <div key={session._id.toString()} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-md text-sm font-medium">
                              {session.class}
                            </div>
                            {session.isPrivate && (
                              <div className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-2.5 py-0.5 rounded-md text-sm font-medium">
                                Private
                              </div>
                            )}
                          </div>
                          <h3 className="font-semibold">{session.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <CalendarDays className="h-4 w-4" />
                            <span>{format(new Date(session.date), 'MMM d, yyyy')} • {session.startTime} - {session.endTime}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-4 w-4" />
                            <span>{session.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Users className="h-4 w-4" />
                            <span>{session.currentParticipants} of {session.maxParticipants} participants</span>
                          </div>
                        </div>
                        <Button asChild variant="outline" size="sm" className="ml-4">
                          <Link href={`/sessions/${session._id}`}>View</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/my-sessions">View All Sessions</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>
        <section className="container py-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Available Study Sessions</h2>
            <Button asChild variant="outline">
              <Link href="/sessions">Browse All</Link>
            </Button>
          </div>
          {availableSessions.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">No available study sessions at the moment.</p>
                <Button asChild className="mt-4 mx-auto block">
                  <Link href="/create">Create Your First Session</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <SessionDialogContainer sessions={mappedSessions.slice(0, 6)} />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

