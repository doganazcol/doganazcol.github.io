import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import { StudySession } from "@/models/StudySession";
import User from "@/models/User";
import { Types } from "mongoose";

export async function POST(
  request: Request,
  { params }: { params: { id: string; requestId: string } }
) {
  try {
    console.log('Processing request:', params.requestId);
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('Unauthorized: No session or email');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      console.log('User not found:', session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const studySession = await StudySession.findById(params.id)
      .populate('pendingRequests.user', '_id fullName email image')
      .populate('participants.user', '_id fullName email image')
      .populate('createdBy', '_id fullName email image');
      
    if (!studySession) {
      console.log('Session not found:', params.id);
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Verify that the current user is the session creator
    const creatorId = studySession.createdBy._id.toString();
    const userId = user._id.toString();
    console.log('Creator ID:', creatorId);
    console.log('User ID:', userId);

    if (creatorId !== userId) {
      console.log('Not creator:', userId, 'vs', creatorId);
      return NextResponse.json(
        { error: "Only the session creator can respond to requests" },
        { status: 403 }
      );
    }

    const pendingRequest = studySession.pendingRequests.id(params.requestId);
    if (!pendingRequest) {
      console.log('Request not found:', params.requestId);
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (pendingRequest.status !== "pending") {
      console.log('Request already processed:', pendingRequest.status);
      return NextResponse.json(
        { error: "This request has already been processed" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action } = body;
    console.log('Action:', action);

    if (!["accept", "reject"].includes(action)) {
      console.log('Invalid action:', action);
      return NextResponse.json(
        { error: "Invalid action. Must be 'accept' or 'reject'" },
        { status: 400 }
      );
    }

    if (action === "accept") {
      // Check if session is full
      if (studySession.currentParticipants >= studySession.maxParticipants) {
        console.log('Session is full');
        return NextResponse.json(
          { error: "Session is full" },
          { status: 400 }
        );
      }

      // Add user to participants
      studySession.participants.push({
        user: pendingRequest.user._id,
        joinedAt: new Date()
      });
      studySession.currentParticipants += 1;
    }

    // Update request status
    pendingRequest.status = action === "accept" ? "accepted" : "rejected";
    console.log('Updating request status to:', pendingRequest.status);

    await studySession.save();
    console.log('Session saved successfully');

    // Fetch the updated session with populated data
    const updatedSession = await StudySession.findById(params.id)
      .populate('pendingRequests.user', '_id fullName email image')
      .populate('participants.user', '_id fullName email image')
      .populate('createdBy', '_id fullName email image');

    return NextResponse.json({
      message: `Request ${action}ed successfully`,
      session: updatedSession,
    });
  } catch (error) {
    console.error("Error processing join request:", error);
    return NextResponse.json(
      { error: "Failed to process join request" },
      { status: 500 }
    );
  }
} 