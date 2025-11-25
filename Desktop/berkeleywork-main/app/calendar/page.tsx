import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import { StudySession, User } from '@/lib/db/schema';
import { CalendarContent } from '@/components/calendar-content';

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  await dbConnect();

  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch all upcoming sessions with populated user data
  const sessions = await StudySession.find({
    date: {
      $gte: today
    }
  })
  .populate({
    path: 'participants.user',
    model: User,
    select: 'fullName email image'
  })
  .populate({
    path: 'pendingRequests.user',
    model: User,
    select: 'fullName email image'
  })
  .populate({
    path: 'createdBy',
    model: User,
    select: 'fullName email image'
  })
  .sort({ date: 1, startTime: 1 });

  return <CalendarContent sessions={JSON.parse(JSON.stringify(sessions))} />;
}

