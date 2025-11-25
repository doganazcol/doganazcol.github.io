import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { User, StudySession } from "@/lib/db/schema";
import dbConnect from "@/lib/db";
import { Types } from "mongoose";

interface Participant {
  user: Types.ObjectId;
  joinedAt: Date;
}

interface JoinRequest {
  user: Types.ObjectId;
  requestedAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
}

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
    const { id } = context.params;
    const studySession = await StudySession.findById(id);
    if (!studySession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if user is already a participant
    const isParticipant = studySession.participants.some(
      (p: any) => p.user.toString() === user._id.toString()
    );

    if (isParticipant) {
      return NextResponse.json(
        { error: 'You are already a participant in this session' },
        { status: 400 }
      );
    }

    // Check if user has a pending request
    const hasPendingRequest = studySession.pendingRequests.some(
      (r: any) => r.user.toString() === user._id.toString() && r.status === 'pending'
    );

    if (hasPendingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending request for this session' },
        { status: 400 }
      );
    }

    if (studySession.isPrivate) {
      // For private sessions, add to pending requests
      const updatedSession = await StudySession.findOneAndUpdate(
        { _id: id },
        {
          $push: {
            pendingRequests: {
              user: user._id,
              status: 'pending',
              requestedAt: new Date()
            }
          }
        },
        { new: true }
      )
      .populate('participants.user', '_id fullName email image')
      .populate('pendingRequests.user', '_id fullName email image')
      .populate('createdBy', '_id fullName email image');

      return NextResponse.json({
        session: updatedSession,
        status: 'pending',
        message: 'Join request sent successfully'
      });
    } else {
      // For public sessions, add directly to participants
      const updatedSession = await StudySession.findOneAndUpdate(
        { _id: id },
        {
          $push: {
            participants: {
              user: user._id,
              joinedAt: new Date()
            }
          },
          $inc: { currentParticipants: 1 }
        },
        { new: true }
      )
      .populate('participants.user', '_id fullName email image')
      .populate('pendingRequests.user', '_id fullName email image')
      .populate('createdBy', '_id fullName email image');

      return NextResponse.json({
        session: updatedSession,
        status: 'joined',
        message: 'Successfully joined session'
      });
    }
  } catch (error) {
    console.error('Error in join request:', error);
    return NextResponse.json(
      { error: 'Failed to process join request' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const { id } = context.params;
    const studySession = await StudySession.findById(id);
    if (!studySession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if user is a participant
    const isParticipant = studySession.participants.some(
      (p: any) => p.user.toString() === user._id.toString()
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You are not a participant of this session' },
        { status: 400 }
      );
    }

    // Remove user from participants and decrement count atomically
    const updatedSession = await StudySession.findOneAndUpdate(
      { _id: id },
      {
        $pull: {
          participants: { user: user._id }
        },
        $inc: { currentParticipants: -1 }
      },
      { new: true }
    )
    .populate('participants.user', '_id fullName email image')
    .populate('pendingRequests.user', '_id fullName email image');

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error in leave session:', error);
    return NextResponse.json(
      { error: 'Failed to leave session' },
      { status: 500 }
    );
  }
} 