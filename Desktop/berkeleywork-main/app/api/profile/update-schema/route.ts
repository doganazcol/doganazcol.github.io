import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/lib/db/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Update the specific user's document to ensure Instagram field exists
    const result = await User.updateOne(
      { email: session.user.email },
      { $set: { instagram: null } },
      { upsert: false }
    );

    console.log('Update result:', result);

    // Fetch the updated user document
    const updatedUser = await User.findOne({ email: session.user.email })
      .select('email fullName class majors interests description instagram')
      .lean();

    console.log('Updated user:', updatedUser);

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating user schema:', error);
    return NextResponse.json(
      { error: 'Failed to update user schema' },
      { status: 500 }
    );
  }
} 