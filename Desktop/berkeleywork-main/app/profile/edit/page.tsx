import { getServerSession } from 'next-auth';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import { User } from '@/lib/db/schema';
import { ProfileSetupForm } from '@/components/profile-setup-form';

interface UserDocument {
  _id: string;
  email: string;
  fullName: string;
  class: string;
  majors: string[];
  interests: string[];
  description: string;
  instagram?: string;
}

export default async function EditProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  await dbConnect();

  const user = await User.findOne({ email: session.user.email })
    .select('email fullName class majors interests description instagram')
    .lean<UserDocument>();

  if (!user) {
    redirect('/profile/setup');
  }

  console.log('Edit page user data:', JSON.stringify(user, null, 2)); // Debug log

  // Format the data for the form
  const formattedData = {
    fullName: user.fullName || '',
    class: user.class || 'freshman',
    majors: user.majors || [],
    // Join interests array into comma-separated string
    interests: (user.interests || []).join(', '),
    description: user.description || '',
    instagram: user.instagram || ''
  };

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>
        <ProfileSetupForm 
          initialData={formattedData}
          isEditing={true}
        />
      </div>
    </div>
  );
} 