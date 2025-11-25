import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/lib/db/schema';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (user) {
      return NextResponse.json({ error: 'Profile already exists' }, { status: 400 });
    }

    const newUser = await User.create({
      email: session.user.email,
      fullName: body.fullName,
      class: body.class,
      majors: body.majors,
      interests: body.interests,
      description: body.description,
      instagram: body.instagram,
    });

    return NextResponse.json(newUser);
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('PUT Request Body:', body);

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Create update object with all fields
    const updateData = {
      fullName: body.fullName,
      class: body.class,
      majors: body.majors,
      interests: body.interests,
      description: body.description,
      instagram: body.instagram || null,
    };

    console.log('Update Data:', updateData);

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      { new: true }
    );

    console.log('Updated User:', updatedUser);

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
} 