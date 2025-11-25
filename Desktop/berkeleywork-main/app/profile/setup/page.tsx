import { getServerSession } from 'next-auth';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import { User } from '@/lib/db/schema';
import { ProfileSetupForm } from '@/components/profile-setup-form';

export default async function ProfileSetupPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  await dbConnect();
  
  // Check if user profile already exists
  const existingUser = await User.findOne({ email: session.user.email });
  if (existingUser) {
    redirect('/profile');
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Complete Your Profile</h1>
        <ProfileSetupForm />
      </div>
    </div>
  );
} 