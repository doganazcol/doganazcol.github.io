import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import { StudySession, User } from '@/lib/db/schema';
import { MySessionsLayout } from '@/components/my-sessions/MySessionsLayout';

export default async function MySessionsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  await dbConnect();
  
  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    redirect('/auth/signin');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch upcoming sessions
  const createdSessions = await StudySession.find({ 
    createdBy: user._id,
    date: { $gte: today }
  })
    .populate('createdBy', 'email fullName')
    .populate('participants.user', 'email fullName image')
    .sort({ date: 1 });

  const joinedSessions = await StudySession.find({ 
    'participants.user': user._id,
    createdBy: { $ne: user._id },
    date: { $gte: today }
  })
    .populate('createdBy', 'email fullName')
    .populate('participants.user', 'email fullName image')
    .sort({ date: 1 });

  // Fetch all past sessions (both created and joined)
  const pastSessions = await StudySession.find({ 
    $or: [
      { createdBy: user._id },
      { 'participants.user': user._id }
    ],
    date: { $lt: today }
  })
    .populate('createdBy', 'email fullName')
    .populate('participants.user', 'email fullName image')
    .sort({ date: -1 });

  return (
    <div className="container mx-auto py-8 px-4">
      <MySessionsLayout 
        createdSessions={JSON.parse(JSON.stringify(createdSessions))}
        joinedSessions={JSON.parse(JSON.stringify(joinedSessions))}
        pastSessions={JSON.parse(JSON.stringify(pastSessions))}
      />
    </div>
  );
}

