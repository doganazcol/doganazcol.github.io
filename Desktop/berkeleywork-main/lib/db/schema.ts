import mongoose from 'mongoose';

declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  class: {
    type: String,
    enum: ['freshman', 'sophomore', 'junior', 'senior', 'masters', 'phd', 'other'],
    required: true,
  },
  majors: [{
    type: String,
    required: true,
  }],
  interests: [{
    type: String,
    required: true,
  }],
  description: {
    type: String,
    required: true,
    minlength: 10,
  },
  instagram: {
    type: String,
    required: false,
  },
  // NEW: Matching Preferences
  matchingPreferences: {
    courses: [{
      type: String,
      default: []
    }],
    studyTimePreferences: [{
      type: String,
      enum: ['early-morning', 'morning', 'afternoon', 'evening', 'late-night'],
      default: []
    }],
    preferredStudyEnvironments: [{
      type: String,
      enum: ['library', 'cafe', 'dorm', 'outdoor', 'quiet', 'collaborative'],
      default: []
    }],
    learningStyles: [{
      type: String,
      enum: ['visual', 'auditory', 'kinesthetic', 'reading-writing'],
      default: []
    }],
    preferredContentTypes: [{
      type: String,
      enum: ['textbook-review', 'midterm-review', 'final-review', 'review-of-week', 'homework', 'projects', 'labs'],
      default: []
    }],
    comfortableDifficultyLevels: [{
      type: String,
      enum: ['beginner', 'medium', 'advanced', 'mock-exam'],
      default: []
    }],
    sessionFrequency: {
      type: String,
      enum: ['daily', 'several-per-week', 'weekly', 'biweekly', 'flexible'],
      required: false
    },
    commitmentLevel: {
      type: String,
      enum: ['casual', 'moderate', 'serious', 'intensive'],
      required: false
    },
    preferredGroupSize: {
      type: Number,
      min: 2,
      max: 10,
      required: false
    },
    introvertExtrovert: {
      type: Number,
      min: 1,
      max: 5,
      required: false
    },
    focusedCollaborative: {
      type: Number,
      min: 1,
      max: 5,
      required: false
    },
    availableDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      default: []
    }],
    studyGoals: [{
      type: String,
      default: []
    }],
  }
}, {
  timestamps: true,
});

const studySessionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  class: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  maxParticipants: {
    type: Number,
    required: true,
  },
  currentParticipants: {
    type: Number,
    default: 0,
  },
  // NEW: Session metadata for matching
  contentType: {
    type: String,
    enum: ['textbook-review', 'midterm-review', 'final-review', 'review-of-week', 'homework', 'projects', 'labs'],
    required: false,
  },
  difficultyLevel: {
    type: String,
    enum: ['beginner', 'medium', 'advanced', 'mock-exam'],
    required: false,
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  pendingRequests: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
studySessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Add indexes for better query performance
studySessionSchema.index({ date: 1 });
studySessionSchema.index({ createdBy: 1 });
studySessionSchema.index({ 'participants.user': 1 });
studySessionSchema.index({ 'pendingRequests.user': 1 });
studySessionSchema.index({ contentType: 1 });
studySessionSchema.index({ difficultyLevel: 1 });

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const StudySession = mongoose.models.StudySession || mongoose.model('StudySession', studySessionSchema); 