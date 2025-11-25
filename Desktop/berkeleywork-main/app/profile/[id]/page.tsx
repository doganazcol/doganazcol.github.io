import { getServerSession } from 'next-auth';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import { User } from '@/lib/db/schema';
import { notFound } from 'next/navigation';

interface UserProfile {
  email: string;
  fullName: string;
  class: string;
  majors: string[];
  interests: string[];
  description: string;
  image?: string;
  instagram?: string;
}

export default async function UserProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  await dbConnect();
  
  // Get the requested user's profile data
  const user = await User.findById(params.id)
    .lean<UserProfile>()
    .exec();

  if (!user) {
    notFound();
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Profile</h1>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Email</h2>
            <p className="text-muted-foreground">{user.email}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Full Name</h2>
            <p className="text-muted-foreground">{user.fullName}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Class</h2>
            <p className="text-muted-foreground capitalize">{user.class}</p>
          </div>

          {user.majors?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Majors</h2>
              <div className="flex flex-wrap gap-2">
                {user.majors.map((major: string) => (
                  <span
                    key={major}
                    className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-md text-sm"
                  >
                    {major}
                  </span>
                ))}
              </div>
            </div>
          )}

          {user.interests?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Interests</h2>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((interest: string) => (
                  <span
                    key={interest}
                    className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-md text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {user.description && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{user.description}</p>
            </div>
          )}

          {user.instagram && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Instagram</h2>
              <a 
                href={`https://instagram.com/${user.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                @{user.instagram}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 