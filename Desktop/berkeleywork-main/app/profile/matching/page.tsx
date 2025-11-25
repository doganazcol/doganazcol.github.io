import { getServerSession } from 'next-auth';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { MatchingPreferencesForm } from '@/components/matching-preferences-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentMatches } from '@/components/student-matches';

export default async function MatchingPreferencesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Student Matching</h1>
          <p className="text-muted-foreground">
            Set your preferences to find the best study partners for your classes
          </p>
        </div>

        <Tabs defaultValue="preferences" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preferences">My Preferences</TabsTrigger>
            <TabsTrigger value="matches">Find Matches</TabsTrigger>
          </TabsList>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Matching Preferences</CardTitle>
                <CardDescription>
                  Tell us about your study preferences to help us find the best matches for you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MatchingPreferencesForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matches">
            <Card>
              <CardHeader>
                <CardTitle>Your Top Matches</CardTitle>
                <CardDescription>
                  Students who match your preferences and study style
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StudentMatches limit={20} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

