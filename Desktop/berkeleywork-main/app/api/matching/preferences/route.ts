import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { User } from '@/lib/db/schema';

// GET - Fetch user's matching preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email })
      .select('matchingPreferences')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      preferences: user.matchingPreferences || {},
    });
  } catch (error) {
    console.error('GET Preferences Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Update user's matching preferences
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: { matchingPreferences: body } },
      { new: true, runValidators: true }
    ).select('matchingPreferences');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Preferences updated successfully',
      preferences: user.matchingPreferences,
    });
  } catch (error) {
    console.error('PUT Preferences Error:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

