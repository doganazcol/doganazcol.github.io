import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { User } from '@/lib/db/schema';
import { findBestMatches, filterCandidatesByPreferences } from '@/lib/matching-algorithm';
import { UserMatchingPreferences } from '@/types/matching';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get current user with their preferences
    const currentUser = await User.findOne({ email: session.user.email })
      .select('_id matchingPreferences majors class')
      .lean();

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const course = searchParams.get('course');
    const minScore = parseInt(searchParams.get('minScore') || '30');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get all other users with their preferences
    const allUsers = await User.find({
      _id: { $ne: currentUser._id },
      'matchingPreferences.courses': { $exists: true, $ne: [] }
    })
      .select('_id fullName email matchingPreferences class majors')
      .lean();

    // Prepare current user's preferences
    const userPrefs: UserMatchingPreferences = {
      academicYear: currentUser.class as any,
      major: currentUser.majors?.[0],
      courses: currentUser.matchingPreferences?.courses || [],
      studyTimePreferences: currentUser.matchingPreferences?.studyTimePreferences || [],
      preferredStudyEnvironments: currentUser.matchingPreferences?.preferredStudyEnvironments || [],
      learningStyles: currentUser.matchingPreferences?.learningStyles || [],
      preferredContentTypes: currentUser.matchingPreferences?.preferredContentTypes || [],
      comfortableDifficultyLevels: currentUser.matchingPreferences?.comfortableDifficultyLevels || [],
      sessionFrequency: currentUser.matchingPreferences?.sessionFrequency as any,
      commitmentLevel: currentUser.matchingPreferences?.commitmentLevel as any,
      preferredGroupSize: currentUser.matchingPreferences?.preferredGroupSize,
      introvertExtrovert: currentUser.matchingPreferences?.introvertExtrovert,
      focusedCollaborative: currentUser.matchingPreferences?.focusedCollaborative,
      availableDays: currentUser.matchingPreferences?.availableDays,
      studyGoals: currentUser.matchingPreferences?.studyGoals,
    };

    // Prepare candidate preferences
    const candidates = allUsers.map(user => ({
      userId: user._id.toString(),
      preferences: {
        academicYear: user.class as any,
        major: user.majors?.[0],
        courses: user.matchingPreferences?.courses || [],
        studyTimePreferences: user.matchingPreferences?.studyTimePreferences || [],
        preferredStudyEnvironments: user.matchingPreferences?.preferredStudyEnvironments || [],
        learningStyles: user.matchingPreferences?.learningStyles || [],
        preferredContentTypes: user.matchingPreferences?.preferredContentTypes || [],
        comfortableDifficultyLevels: user.matchingPreferences?.comfortableDifficultyLevels || [],
        sessionFrequency: user.matchingPreferences?.sessionFrequency as any,
        commitmentLevel: user.matchingPreferences?.commitmentLevel as any,
        preferredGroupSize: user.matchingPreferences?.preferredGroupSize,
        introvertExtrovert: user.matchingPreferences?.introvertExtrovert,
        focusedCollaborative: user.matchingPreferences?.focusedCollaborative,
        availableDays: user.matchingPreferences?.availableDays,
        studyGoals: user.matchingPreferences?.studyGoals,
      } as UserMatchingPreferences,
    }));

    // Filter by course if specified
    let filteredCandidates = candidates;
    if (course) {
      filteredCandidates = filterCandidatesByPreferences(candidates, {
        courses: [course],
      });
    }

    // Find best matches
    const matches = findBestMatches(userPrefs, filteredCandidates, minScore, limit);

    // Enrich matches with user details
    const enrichedMatches = matches.map(match => {
      const user = allUsers.find(u => u._id.toString() === match.userId);
      return {
        ...match,
        user: {
          _id: user?._id.toString(),
          fullName: user?.fullName,
          email: user?.email,
          class: user?.class,
          majors: user?.majors,
        },
      };
    });

    return NextResponse.json({
      matches: enrichedMatches,
      total: enrichedMatches.length,
    });
  } catch (error) {
    console.error('Matching Error:', error);
    return NextResponse.json(
      { error: 'Failed to find matches', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

