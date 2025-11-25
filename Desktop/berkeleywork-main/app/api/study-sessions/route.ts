import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { User, StudySession } from '@/lib/db/schema';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Connecting to MongoDB...');
    await dbConnect();
    console.log('MongoDB connected successfully');

    // Find the user by email first
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    console.log('Request body:', body);

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
      isPrivate,
    } = body;

    const sessionData = {
      title,
      class: className,
      contentType,
      date: new Date(date),
      startTime,
      endTime,
      location,
      description,
      maxParticipants,
      isPrivate,
      createdBy: user._id,
      createdById: session.user.email,
      participants: [{ user: user._id }],
      currentParticipants: 1,
    };

    console.log('Creating study session with data:', sessionData);

    const studySession = await StudySession.create(sessionData);

    // Populate the creator's information before returning
    const populatedSession = await StudySession.findById(studySession._id)
      .populate('createdBy', '_id fullName email image')
      .populate('participants.user', '_id fullName email image')
      .populate('pendingRequests.user', '_id fullName email image');

    console.log('Study session created successfully:', populatedSession);
    return NextResponse.json(populatedSession);
  } catch (error) {
    console.error('Detailed error creating study session:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to create study session: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create study session' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log('Connecting to MongoDB for GET request...');
    await dbConnect();
    console.log('MongoDB connected successfully for GET request');
    
    const sessions = await StudySession.find()
      .populate('createdBy', '_id fullName email image')
      .populate('participants.user', '_id fullName email image')
      .populate('pendingRequests.user', '_id fullName email image')
      .sort({ createdAt: -1 });
    console.log('Sessions fetched successfully:', sessions);
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Detailed error fetching study sessions:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to fetch study sessions: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch study sessions' },
      { status: 500 }
    );
  }
} 