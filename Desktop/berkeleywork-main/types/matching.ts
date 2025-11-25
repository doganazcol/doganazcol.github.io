// Student Matching Types and Preferences

export type AcademicYear = 'freshman' | 'sophomore' | 'junior' | 'senior' | 'masters' | 'phd' | 'other';

export type StudyTimePreference = 'early-morning' | 'morning' | 'afternoon' | 'evening' | 'late-night';

export type StudyEnvironment = 'library' | 'cafe' | 'dorm' | 'outdoor' | 'quiet' | 'collaborative';

export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing';

export type SessionFrequency = 'daily' | 'several-per-week' | 'weekly' | 'biweekly' | 'flexible';

export type CommitmentLevel = 'casual' | 'moderate' | 'serious' | 'intensive';

// NEW: Session content types
export type SessionContentType = 
  | 'textbook-review' 
  | 'midterm-review' 
  | 'final-review' 
  | 'review-of-week' 
  | 'homework' 
  | 'projects' 
  | 'labs';

// NEW: Difficulty levels
export type DifficultyLevel = 'beginner' | 'medium' | 'advanced' | 'mock-exam';

export interface UserMatchingPreferences {
  // Academic Information
  academicYear?: AcademicYear;
  major?: string;
  courses: string[]; // Course codes/names
  
  // Study Preferences
  studyTimePreferences: StudyTimePreference[];
  preferredStudyEnvironments: StudyEnvironment[];
  learningStyles: LearningStyle[];
  
  // Session Preferences
  sessionFrequency?: SessionFrequency;
  commitmentLevel?: CommitmentLevel;
  preferredGroupSize?: number; // 2-10
  
  // NEW: Content & Difficulty Preferences
  preferredContentTypes?: SessionContentType[]; // Types of sessions they want to attend
  comfortableDifficultyLevels?: DifficultyLevel[]; // Difficulty levels they're comfortable with
  
  // Personality & Work Style
  introvertExtrovert?: number; // 1-5 scale (1=introvert, 5=extrovert)
  focusedCollaborative?: number; // 1-5 scale (1=focused/independent, 5=collaborative)
  
  // Availability
  availableDays?: string[]; // ['monday', 'tuesday', etc.]
  timeZone?: string;
  
  // Goals & Interests
  studyGoals?: string[]; // ['exam-prep', 'homework-help', 'project-collab', 'concept-review']
  interests?: string[]; // General interests for ice-breaking
}

export interface MatchScore {
  userId: string;
  score: number; // 0-100
  breakdown: {
    courseOverlap: number;
    timeCompatibility: number;
    learningStyleMatch: number;
    academicYearMatch: number;
    environmentMatch: number;
    personalityMatch: number;
    goalAlignment: number;
    contentTypeMatch: number;        // NEW
    difficultyLevelMatch: number;    // NEW
  };
  sharedCourses: string[];
  compatibilityReasons: string[];
}

export interface MatchingWeights {
  courseOverlap: number;
  timeCompatibility: number;
  learningStyleMatch: number;
  academicYearMatch: number;
  environmentMatch: number;
  personalityMatch: number;
  goalAlignment: number;
  contentTypeMatch: number;        // NEW
  difficultyLevelMatch: number;    // NEW
}

export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  courseOverlap: 0.30,           // Most important - shared classes
  timeCompatibility: 0.20,        // Second most important - can actually meet
  contentTypeMatch: 0.15,         // NEW: Important - what they want to work on
  difficultyLevelMatch: 0.12,     // NEW: Important - matching skill levels
  learningStyleMatch: 0.10,       // Moderate importance
  academicYearMatch: 0.05,        // Some importance
  environmentMatch: 0.04,         // Some importance
  personalityMatch: 0.02,         // Nice to have
  goalAlignment: 0.02,            // Nice to have
};

