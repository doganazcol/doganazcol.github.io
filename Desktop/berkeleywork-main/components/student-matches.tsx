"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, Clock, Target, Loader2 } from "lucide-react";
import Link from "next/link";

interface Match {
  userId: string;
  score: number;
  breakdown: {
    courseOverlap: number;
    timeCompatibility: number;
    contentTypeMatch: number;
    difficultyLevelMatch: number;
    [key: string]: number;
  };
  sharedCourses: string[];
  compatibilityReasons: string[];
  user: {
    _id: string;
    fullName: string;
    email: string;
    class: string;
    majors: string[];
  };
}

interface StudentMatchesProps {
  course?: string;
  limit?: number;
}

export function StudentMatches({ course, limit = 10 }: StudentMatchesProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (course) params.append('course', course);
        params.append('limit', limit.toString());

        const response = await fetch(`/api/matching?${params}`);
        if (!response.ok) throw new Error('Failed to fetch matches');

        const data = await response.json();
        setMatches(data.matches || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, [course, limit]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Finding your best study matches...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">No matches found yet.</p>
            <p className="text-sm">Try updating your matching preferences to find study partners!</p>
            <Link href="/profile/matching">
              <Button className="mt-4">Update Preferences</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <Card key={match.userId} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {match.user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">
                    <Link href={`/profile/${match.user._id}`} className="hover:underline">
                      {match.user.fullName}
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    {match.user.class && (
                      <span className="capitalize">{match.user.class}</span>
                    )}
                    {match.user.majors && match.user.majors.length > 0 && (
                      <span> • {match.user.majors.join(', ')}</span>
                    )}
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${getScoreColor(match.score)}`}>
                  {match.score}%
                </div>
                <div className="text-xs text-muted-foreground">Match Score</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Shared Courses */}
            {match.sharedCourses.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <BookOpen className="h-4 w-4" />
                  Shared Courses
                </div>
                <div className="flex flex-wrap gap-2">
                  {match.sharedCourses.map((course) => (
                    <Badge key={course} variant="secondary">
                      {course}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Compatibility Reasons */}
            {match.compatibilityReasons.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Target className="h-4 w-4" />
                  Why you match
                </div>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  {match.compatibilityReasons.map((reason, idx) => (
                    <li key={idx}>• {reason}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Match Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div>
                <div className="font-medium">Courses</div>
                <div className="text-muted-foreground">{match.breakdown.courseOverlap}%</div>
              </div>
              <div>
                <div className="font-medium">Time</div>
                <div className="text-muted-foreground">{match.breakdown.timeCompatibility}%</div>
              </div>
              <div>
                <div className="font-medium">Content</div>
                <div className="text-muted-foreground">{match.breakdown.contentTypeMatch}%</div>
              </div>
              <div>
                <div className="font-medium">Level</div>
                <div className="text-muted-foreground">{match.breakdown.difficultyLevelMatch}%</div>
              </div>
            </div>

            <div className="pt-2">
              <Link href={`/profile/${match.user._id}`}>
                <Button variant="outline" className="w-full">
                  View Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

