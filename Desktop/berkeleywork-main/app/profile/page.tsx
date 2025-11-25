import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import { User } from '@/lib/db/schema';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';

interface UserProfile {
  email: string;
  fullName: string;
  class: string;
  majors: string[];
  interests: string[];
  description: string;
  instagram?: string;
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  await dbConnect();
  
  // Get user profile data
  let user = await User.findOne({ email: session.user.email })
    .select('email fullName class majors interests description instagram')
    .lean<UserProfile>()
    .exec();

  if (!user) {
    // If user profile doesn't exist, redirect to profile setup
    redirect('/profile/setup');
  }

  // If instagram field doesn't exist, update the document
  if (!('instagram' in user)) {
    const result = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: { instagram: null } },
      { new: true }
    )
    .select('email fullName class majors interests description instagram')
    .lean<UserProfile>();
    
    if (result) {
      user = result;
    }
  }

  console.log('User profile data:', JSON.stringify(user, null, 2)); // Pretty print the user data

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Profile</h1>
          <Button asChild>
            <Link href="/profile/edit">Edit Profile</Link>
          </Button>
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

          <div>
            <h2 className="text-lg font-semibold mb-2">Instagram</h2>
            {user.instagram ? (
              <a 
                href={`https://instagram.com/${user.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                @{user.instagram}
              </a>
            ) : (
              <p className="text-muted-foreground">No Instagram username provided</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 