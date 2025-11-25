// Student Matching Algorithm Implementation

import {
  UserMatchingPreferences,
  MatchScore,
  MatchingWeights,
  DEFAULT_MATCHING_WEIGHTS,
  StudyTimePreference,
  LearningStyle,
  StudyEnvironment,
  AcademicYear,
  SessionContentType,      // NEW
  DifficultyLevel,         // NEW
} from '@/types/matching';

/**
 * Calculate match score between two users based on their preferences
 */
export function calculateMatchScore(
  userPrefs: UserMatchingPreferences,
  candidatePrefs: UserMatchingPreferences,
  weights: MatchingWeights = DEFAULT_MATCHING_WEIGHTS,
  candidateUserId: string
): MatchScore {
  const breakdown = {
    courseOverlap: calculateCourseOverlap(userPrefs.courses, candidatePrefs.courses),
    timeCompatibility: calculateTimeCompatibility(
      userPrefs.studyTimePreferences,
      candidatePrefs.studyTimePreferences
    ),
    learningStyleMatch: calculateLearningStyleMatch(
      userPrefs.learningStyles,
      candidatePrefs.learningStyles
    ),
    academicYearMatch: calculateAcademicYearMatch(
      userPrefs.academicYear,
      candidatePrefs.academicYear
    ),
    environmentMatch: calculateEnvironmentMatch(
      userPrefs.preferredStudyEnvironments,
      candidatePrefs.preferredStudyEnvironments
    ),
    personalityMatch: calculatePersonalityMatch(
      userPrefs.introvertExtrovert,
      candidatePrefs.introvertExtrovert,
      userPrefs.focusedCollaborative,
      candidatePrefs.focusedCollaborative
    ),
    goalAlignment: calculateGoalAlignment(userPrefs.studyGoals, candidatePrefs.studyGoals),
    // NEW: Add content type and difficulty level matching
    contentTypeMatch: calculateContentTypeMatch(
      userPrefs.preferredContentTypes,
      candidatePrefs.preferredContentTypes
    ),
    difficultyLevelMatch: calculateDifficultyLevelMatch(
      userPrefs.comfortableDifficultyLevels,
      candidatePrefs.comfortableDifficultyLevels
    ),
  };

  // Calculate weighted score
  const score =
    breakdown.courseOverlap * weights.courseOverlap +
    breakdown.timeCompatibility * weights.timeCompatibility +
    breakdown.learningStyleMatch * weights.learningStyleMatch +
    breakdown.academicYearMatch * weights.academicYearMatch +
    breakdown.environmentMatch * weights.environmentMatch +
    breakdown.personalityMatch * weights.personalityMatch +
    breakdown.goalAlignment * weights.goalAlignment +
    breakdown.contentTypeMatch * weights.contentTypeMatch +           // NEW
    breakdown.difficultyLevelMatch * weights.difficultyLevelMatch;    // NEW

  const sharedCourses = findSharedItems(userPrefs.courses, candidatePrefs.courses);
  const compatibilityReasons = generateCompatibilityReasons(breakdown, sharedCourses, userPrefs, candidatePrefs);

  return {
    userId: candidateUserId,
    score: Math.round(score * 100),
    breakdown: {
      courseOverlap: Math.round(breakdown.courseOverlap * 100),
      timeCompatibility: Math.round(breakdown.timeCompatibility * 100),
      learningStyleMatch: Math.round(breakdown.learningStyleMatch * 100),
      academicYearMatch: Math.round(breakdown.academicYearMatch * 100),
      environmentMatch: Math.round(breakdown.environmentMatch * 100),
      personalityMatch: Math.round(breakdown.personalityMatch * 100),
      goalAlignment: Math.round(breakdown.goalAlignment * 100),
      contentTypeMatch: Math.round(breakdown.contentTypeMatch * 100),          // NEW
      difficultyLevelMatch: Math.round(breakdown.difficultyLevelMatch * 100),  // NEW
    },
    sharedCourses,
    compatibilityReasons,
  };
}

/**
 * Calculate course overlap score (0-1)
 */
function calculateCourseOverlap(courses1: string[], courses2: string[]): number {
  if (!courses1?.length || !courses2?.length) return 0;

  const shared = findSharedItems(courses1, courses2);
  const totalUnique = new Set([...courses1, ...courses2]).size;

  // Jaccard similarity with bonus for multiple shared courses
  const jaccardSimilarity = shared.length / totalUnique;
  const sharedBonus = Math.min(shared.length * 0.15, 0.3); // Up to 30% bonus for multiple shared courses

  return Math.min(jaccardSimilarity + sharedBonus, 1.0);
}

/**
 * Calculate time compatibility score (0-1)
 */
function calculateTimeCompatibility(
  times1: StudyTimePreference[],
  times2: StudyTimePreference[]
): number {
  if (!times1?.length || !times2?.length) return 0.5; // Neutral if not specified

  const shared = findSharedItems(times1, times2);
  
  // Higher score for more overlapping time preferences
  return Math.min(shared.length / Math.min(times1.length, times2.length), 1.0);
}

/**
 * Calculate learning style compatibility (0-1)
 */
function calculateLearningStyleMatch(
  styles1: LearningStyle[],
  styles2: LearningStyle[]
): number {
  if (!styles1?.length || !styles2?.length) return 0.5; // Neutral if not specified

  const shared = findSharedItems(styles1, styles2);
  
  // Similar learning styles or complementary styles both work
  const overlapScore = shared.length / Math.max(styles1.length, styles2.length);
  
  return overlapScore;
}

/**
 * Calculate academic year match (0-1)
 */
function calculateAcademicYearMatch(
  year1?: AcademicYear,
  year2?: AcademicYear
): number {
  if (!year1 || !year2) return 0.5; // Neutral if not specified

  if (year1 === year2) return 1.0; // Same year - perfect match

  const yearOrder: AcademicYear[] = ['freshman', 'sophomore', 'junior', 'senior', 'masters', 'phd'];
  const idx1 = yearOrder.indexOf(year1);
  const idx2 = yearOrder.indexOf(year2);

  if (idx1 === -1 || idx2 === -1) return 0.5; // Unknown year

  // Adjacent years get high score, decrease with distance
  const distance = Math.abs(idx1 - idx2);
  
  if (distance === 0) return 1.0;
  if (distance === 1) return 0.8; // Adjacent years
  if (distance === 2) return 0.6;
  return 0.4;
}

/**
 * Calculate study environment match (0-1)
 */
function calculateEnvironmentMatch(
  envs1: StudyEnvironment[],
  envs2: StudyEnvironment[]
): number {
  if (!envs1?.length || !envs2?.length) return 0.5; // Neutral if not specified

  const shared = findSharedItems(envs1, envs2);
  return Math.min(shared.length / Math.min(envs1.length, envs2.length), 1.0);
}

/**
 * Calculate personality compatibility (0-1)
 */
function calculatePersonalityMatch(
  introExtro1?: number,
  introExtro2?: number,
  focusCollab1?: number,
  focusCollab2?: number
): number {
  if (introExtro1 == null || introExtro2 == null || focusCollab1 == null || focusCollab2 == null) {
    return 0.5; // Neutral if not specified
  }

  // Calculate distance on 1-5 scale, normalize to 0-1
  const introExtroDistance = Math.abs(introExtro1 - introExtro2) / 4;
  const focusCollabDistance = Math.abs(focusCollab1 - focusCollab2) / 4;

  // Similar personalities match well (inverse of distance)
  const introExtroMatch = 1 - introExtroDistance;
  const focusCollabMatch = 1 - focusCollabDistance;

  // Average the two personality dimensions
  return (introExtroMatch + focusCollabMatch) / 2;
}

/**
 * Calculate study goal alignment (0-1)
 */
function calculateGoalAlignment(goals1?: string[], goals2?: string[]): number {
  if (!goals1?.length || !goals2?.length) return 0.5; // Neutral if not specified

  const shared = findSharedItems(goals1, goals2);
  return Math.min(shared.length / Math.min(goals1.length, goals2.length), 1.0);
}

/**
 * Calculate session content type match (0-1)
 * NEW FUNCTION
 */
function calculateContentTypeMatch(
  types1?: SessionContentType[],
  types2?: SessionContentType[]
): number {
  if (!types1?.length || !types2?.length) return 0.5; // Neutral if not specified

  const shared = findSharedItems(types1, types2);
  
  // Perfect match if they have overlapping content preferences
  return Math.min(shared.length / Math.min(types1.length, types2.length), 1.0);
}

/**
 * Calculate difficulty level compatibility (0-1)
 * NEW FUNCTION
 */
function calculateDifficultyLevelMatch(
  levels1?: DifficultyLevel[],
  levels2?: DifficultyLevel[]
): number {
  if (!levels1?.length || !levels2?.length) return 0.5; // Neutral if not specified

  const shared = findSharedItems(levels1, levels2);
  
  // Check if there's any overlap in comfortable difficulty levels
  if (shared.length === 0) {
    // No overlap - check if levels are adjacent
    const levelOrder: DifficultyLevel[] = ['beginner', 'medium', 'advanced', 'mock-exam'];
    
    const minLevel1 = Math.min(...levels1.map(l => levelOrder.indexOf(l)).filter(i => i !== -1));
    const maxLevel1 = Math.max(...levels1.map(l => levelOrder.indexOf(l)).filter(i => i !== -1));
    const minLevel2 = Math.min(...levels2.map(l => levelOrder.indexOf(l)).filter(i => i !== -1));
    const maxLevel2 = Math.max(...levels2.map(l => levelOrder.indexOf(l)).filter(i => i !== -1));
    
    // Check if ranges are adjacent or overlapping
    const distance = Math.max(0, Math.max(minLevel1, minLevel2) - Math.min(maxLevel1, maxLevel2));
    
    if (distance === 0) return 0.6; // Adjacent or overlapping ranges
    if (distance === 1) return 0.4; // One level apart
    return 0.2; // Further apart
  }
  
  // Has overlap - good match
  return Math.min(shared.length / Math.min(levels1.length, levels2.length), 1.0);
}

/**
 * Find shared items between two arrays
 */
function findSharedItems<T>(arr1: T[], arr2: T[]): T[] {
  const set2 = new Set(arr2);
  return arr1.filter(item => set2.has(item));
}

/**
 * Generate human-readable compatibility reasons
 */
function generateCompatibilityReasons(
  breakdown: Record<string, number>,
  sharedCourses: string[],
  userPrefs: UserMatchingPreferences,
  candidatePrefs: UserMatchingPreferences
): string[] {
  const reasons: string[] = [];

  // Shared courses (most important)
  if (sharedCourses.length > 0) {
    if (sharedCourses.length === 1) {
      reasons.push(`Taking ${sharedCourses[0]} together`);
    } else {
      reasons.push(`${sharedCourses.length} shared courses`);
    }
  }

  // NEW: Content type matching
  if (breakdown.contentTypeMatch > 0.6) {
    const sharedContentTypes = findSharedItems(
      userPrefs.preferredContentTypes || [],
      candidatePrefs.preferredContentTypes || []
    );
    if (sharedContentTypes.length > 0) {
      reasons.push(`Both interested in ${formatContentType(sharedContentTypes[0])}`);
    }
  }

  // NEW: Difficulty level matching
  if (breakdown.difficultyLevelMatch > 0.6) {
    const sharedLevels = findSharedItems(
      userPrefs.comfortableDifficultyLevels || [],
      candidatePrefs.comfortableDifficultyLevels || []
    );
    if (sharedLevels.length > 0) {
      reasons.push(`Similar skill level: ${formatDifficultyLevel(sharedLevels[0])}`);
    }
  }

  // Time compatibility
  if (breakdown.timeCompatibility > 0.7) {
    const sharedTimes = findSharedItems(
      userPrefs.studyTimePreferences,
      candidatePrefs.studyTimePreferences
    );
    if (sharedTimes.length > 0) {
      reasons.push(`Both prefer ${formatTimePreference(sharedTimes[0])} study sessions`);
    }
  }

  // Academic year
  if (breakdown.academicYearMatch === 1.0 && userPrefs.academicYear) {
    reasons.push(`Both are ${formatAcademicYear(userPrefs.academicYear)}s`);
  }

  // Learning style
  if (breakdown.learningStyleMatch > 0.6) {
    const sharedStyles = findSharedItems(userPrefs.learningStyles, candidatePrefs.learningStyles);
    if (sharedStyles.length > 0) {
      reasons.push(`Compatible learning style: ${formatLearningStyle(sharedStyles[0])}`);
    }
  }

  // Study environment
  if (breakdown.environmentMatch > 0.6) {
    const sharedEnvs = findSharedItems(
      userPrefs.preferredStudyEnvironments,
      candidatePrefs.preferredStudyEnvironments
    );
    if (sharedEnvs.length > 0) {
      reasons.push(`Both like studying in ${formatEnvironment(sharedEnvs[0])}s`);
    }
  }

  // Study goals
  if (breakdown.goalAlignment > 0.6) {
    const sharedGoals = findSharedItems(userPrefs.studyGoals || [], candidatePrefs.studyGoals || []);
    if (sharedGoals.length > 0) {
      reasons.push(`Similar goals: ${formatGoal(sharedGoals[0])}`);
    }
  }

  return reasons;
}

// Formatting helpers
function formatTimePreference(pref: StudyTimePreference): string {
  return pref.replace('-', ' ');
}

function formatAcademicYear(year: AcademicYear): string {
  return year.charAt(0).toUpperCase() + year.slice(1);
}

function formatLearningStyle(style: LearningStyle): string {
  return style.replace('-', '/');
}

function formatEnvironment(env: StudyEnvironment): string {
  return env;
}

function formatGoal(goal: string): string {
  return goal.replace('-', ' ');
}

// NEW: Formatting helpers for new types
function formatContentType(type: SessionContentType): string {
  const formats: Record<SessionContentType, string> = {
    'textbook-review': 'textbook review',
    'midterm-review': 'midterm review',
    'final-review': 'final review',
    'review-of-week': 'review of the week',
    'homework': 'homework',
    'projects': 'projects',
    'labs': 'labs',
  };
  return formats[type] || type;
}

function formatDifficultyLevel(level: DifficultyLevel): string {
  const formats: Record<DifficultyLevel, string> = {
    'beginner': 'Beginner',
    'medium': 'Medium',
    'advanced': 'Advanced',
    'mock-exam': 'Mock Exam',
  };
  return formats[level] || level;
}

/**
 * Find best matches for a user from a list of candidates
 */
export function findBestMatches(
  userPrefs: UserMatchingPreferences,
  candidates: Array<{ userId: string; preferences: UserMatchingPreferences }>,
  minScore: number = 30,
  limit: number = 20
): MatchScore[] {
  const matches = candidates
    .map(candidate => calculateMatchScore(userPrefs, candidate.preferences, DEFAULT_MATCHING_WEIGHTS, candidate.userId))
    .filter(match => match.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return matches;
}

/**
 * Filter candidates by specific criteria
 */
export function filterCandidatesByPreferences(
  candidates: Array<{ userId: string; preferences: UserMatchingPreferences }>,
  filters: {
    courses?: string[];
    academicYear?: AcademicYear;
    studyTimes?: StudyTimePreference[];
    contentTypes?: SessionContentType[];        // NEW
    difficultyLevels?: DifficultyLevel[];       // NEW
    minGroupSize?: number;
    maxGroupSize?: number;
  }
): Array<{ userId: string; preferences: UserMatchingPreferences }> {
  return candidates.filter(candidate => {
    const prefs = candidate.preferences;

    // Course filter
    if (filters.courses && filters.courses.length > 0) {
      const hasSharedCourse = filters.courses.some(course => prefs.courses.includes(course));
      if (!hasSharedCourse) return false;
    }

    // Academic year filter
    if (filters.academicYear && prefs.academicYear !== filters.academicYear) {
      return false;
    }

    // Study time filter
    if (filters.studyTimes && filters.studyTimes.length > 0) {
      const hasSharedTime = filters.studyTimes.some(time =>
        prefs.studyTimePreferences.includes(time)
      );
      if (!hasSharedTime) return false;
    }

    // NEW: Content type filter
    if (filters.contentTypes && filters.contentTypes.length > 0) {
      const hasSharedContentType = filters.contentTypes.some(type =>
        prefs.preferredContentTypes?.includes(type)
      );
      if (!hasSharedContentType) return false;
    }

    // NEW: Difficulty level filter
    if (filters.difficultyLevels && filters.difficultyLevels.length > 0) {
      const hasSharedDifficultyLevel = filters.difficultyLevels.some(level =>
        prefs.comfortableDifficultyLevels?.includes(level)
      );
      if (!hasSharedDifficultyLevel) return false;
    }

    // Group size filter
    if (filters.minGroupSize && prefs.preferredGroupSize && prefs.preferredGroupSize < filters.minGroupSize) {
      return false;
    }
    if (filters.maxGroupSize && prefs.preferredGroupSize && prefs.preferredGroupSize > filters.maxGroupSize) {
      return false;
    }

    return true;
  });
}

