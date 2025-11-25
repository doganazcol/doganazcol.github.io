import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import { StudySession, User } from "@/lib/db/schema";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get the current user (session creator)
    const creator = await User.findOne({ email: session.user.email });
    if (!creator) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the study session
    const studySession = await StudySession.findById(params.id)
      .populate('participants.user', '_id fullName email image')
      .populate('createdBy', '_id fullName email image');

    if (!studySession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Verify that the current user is the session creator
    if (studySession.createdBy._id.toString() !== creator._id.toString()) {
      return NextResponse.json(
        { error: "Only the session creator can kick participants" },
        { status: 403 }
      );
    }

    // Get the user to kick from the request body
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Find the participant to kick
    const participantIndex = studySession.participants.findIndex(
      (p: any) => p.user._id.toString() === userId
    );

    if (participantIndex === -1) {
      return NextResponse.json(
        { error: "User is not a participant in this session" },
        { status: 404 }
      );
    }

    // Remove the participant and decrement the count
    studySession.participants.splice(participantIndex, 1);
    studySession.currentParticipants -= 1;

    // Save the updated session
    await studySession.save();

    // Return the updated session
    const updatedSession = await StudySession.findById(params.id)
      .populate('participants.user', '_id fullName email image')
      .populate('pendingRequests.user', '_id fullName email image')
      .populate('createdBy', '_id fullName email image');

    return NextResponse.json({
      message: "Participant kicked successfully",
      session: updatedSession,
    });
  } catch (error) {
    console.error("Error kicking participant:", error);
    return NextResponse.json(
      { error: "Failed to kick participant" },
      { status: 500 }
    );
  }
} 