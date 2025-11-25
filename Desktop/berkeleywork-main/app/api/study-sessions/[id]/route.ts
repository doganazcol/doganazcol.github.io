import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { StudySession } from '@/lib/db/schema';
import { User } from '@/lib/db/schema';
import { Types } from 'mongoose';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const studySession = await StudySession.findById(params.id);

    if (!studySession) {
      return NextResponse.json(
        { error: 'Study session not found' },
        { status: 404 }
      );
    }

    if (studySession.createdById !== session.user.email) {
      return NextResponse.json(
        { error: 'You can only edit your own sessions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      class: className,
      date,
      startTime,
      endTime,
      location,
      description,
      maxParticipants,
    } = body;

    const updatedSession = await StudySession.findByIdAndUpdate(
      params.id,
      {
        title,
        class: className,
        date: new Date(date),
        startTime,
        endTime,
        location,
        description,
        maxParticipants,
      },
      { new: true }
    )
    .populate('createdBy', '_id fullName email image')
    .populate('participants.user', '_id fullName email image')
    .populate('pendingRequests.user', '_id fullName email image');

    if (!updatedSession) {
      return NextResponse.json(
        { error: 'Failed to update study session' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error updating study session:', error);
    return NextResponse.json(
      { error: 'Failed to update study session' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get session and validate authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Validate ObjectId
    if (!Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    // Find the user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the study session
    const studySession = await StudySession.findById(params.id);
    if (!studySession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if the user is the creator of the session
    if (studySession.createdBy.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized to delete this session' }, { status: 403 });
    }

    // Delete the session
    await StudySession.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete session' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Validate ObjectId
    if (!Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    const session = await StudySession.findById(params.id)
      .populate('createdBy', '_id name email image')
      .populate('participants.user', '_id name email image')
      .populate('pendingRequests.user', '_id name email image');

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch session' },
      { status: 500 }
    );
  }
} 