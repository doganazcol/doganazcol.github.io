import { getServerSession } from 'next-auth';
import { authOptions } from '../../../api/auth/[...nextauth]/route';
import { notFound, redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import { StudySession } from '@/lib/db/schema';
import { EditSessionForm } from '@/components/edit-session-form';

export default async function EditSessionPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  await dbConnect();
  const studySession = await StudySession.findById(params.id);

  if (!studySession) {
    notFound();
  }

  if (studySession.createdById !== session.user.id) {
    redirect('/my-sessions');
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Edit Study Session</h1>
      <EditSessionForm session={JSON.parse(JSON.stringify(studySession))} />
    </div>
  );
} 