import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { User, StudySession } from '@/lib/db/schema';

export async function POST(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the session ID from context
    const id = context.params.id;
    const studySession = await StudySession.findById(id);
    if (!studySession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Find and remove the pending request
    const requestIndex = studySession.pendingRequests.findIndex(
      (r: any) => r.user.toString() === user._id.toString() && r.status === 'pending'
    );

    if (requestIndex === -1) {
      return NextResponse.json(
        { error: 'No pending request found' },
        { status: 404 }
      );
    }

    // Remove the request
    studySession.pendingRequests.splice(requestIndex, 1);
    await studySession.save();

    // Return updated session
    const updatedSession = await StudySession.findById(id)
      .populate('participants.user', '_id fullName email image')
      .populate('pendingRequests.user', '_id fullName email image')
      .populate('createdBy', '_id fullName email image');

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error('Error canceling request:', error);
    return NextResponse.json(
      { error: 'Failed to cancel request' },
      { status: 500 }
    );
  }
} 