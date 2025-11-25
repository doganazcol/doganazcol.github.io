import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { StudySession } from '@/models/StudySession';
import User from '@/models/User';

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to delete a session' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    // Get the current user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if user is admin
    const isAdmin = user.email === "tguliyev@berkeley.edu"; // Admin email
    
    // Get the session ID from context
    const { id } = context.params;
    const studySession = await StudySession.findById(id);

    if (!studySession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if user is the creator or admin
    if (studySession.createdBy.toString() !== user._id.toString() && !isAdmin) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this session' },
        { status: 403 }
      );
    }

    await studySession.deleteOne();

    return NextResponse.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    // Get the session ID from context
    const { id } = context.params;
    
    const studySession = await StudySession.findById(id)
      .populate('createdBy', '_id email fullName image')
      .populate('participants.user', 'email fullName image')
      .populate('pendingRequests.user', 'email fullName image');

    if (!studySession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(studySession);
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get the current user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get the session ID from context
    const { id } = context.params;
    const studySession = await StudySession.findById(id);

    if (!studySession) {
      return NextResponse.json(
        { error: 'Study session not found' },
        { status: 404 }
      );
    }

    // Log the IDs for debugging
    console.log('User ID:', user._id.toString());
    console.log('Session Creator ID:', studySession.createdBy.toString());

    if (studySession.createdBy.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'You can only edit your own sessions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      class: className,
      contentType,
      date,
      startTime,
      endTime,
      location,
      description,
      maxParticipants,
    } = body;

    const updatedSession = await StudySession.findByIdAndUpdate(
      id,
      {
        title,
        class: className,
        contentType,
        date: new Date(date),
        startTime,
        endTime,
        location,
        description,
        maxParticipants,
      },
      { new: true }
    )
    .populate('createdBy', 'email fullName image')
    .populate('participants.user', 'email fullName image')
    .populate('pendingRequests.user', 'email fullName image');

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