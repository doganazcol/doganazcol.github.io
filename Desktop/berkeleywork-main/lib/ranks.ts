export interface Rank {
  name: string;
  icon: string;
  minSessions: number;
  color: string;
  description: string;
}

export const ranks: Rank[] = [
  {
    name: "Newcomer",
    icon: "🌱",
    minSessions: 0,
    color: "text-green-500",
    description: "Just starting your study journey"
  },
  {
    name: "Regular",
    icon: "📚",
    minSessions: 5,
    color: "text-blue-500",
    description: "Consistent study habits"
  },
  {
    name: "Scholar",
    icon: "🎓",
    minSessions: 15,
    color: "text-purple-500",
    description: "Dedicated to academic excellence"
  },
  {
    name: "Master",
    icon: "⭐",
    minSessions: 30,
    color: "text-amber-500",
    description: "Expert in collaborative learning"
  },
  {
    name: "Champion",
    icon: "🏆",
    minSessions: 50,
    color: "text-red-500",
    description: "Top-tier study leader"
  }
];

export function getUserRank(sessionsCount: number): Rank {
  return ranks.findLast(rank => sessionsCount >= rank.minSessions) || ranks[0];
}

export function getNextRank(sessionsCount: number): Rank | null {
  const currentRank = getUserRank(sessionsCount);
  const currentIndex = ranks.indexOf(currentRank);
  return ranks[currentIndex + 1] || null;
}

export function getRankProgress(sessionsCount: number): { current: number; next: number; percentage: number } {
  const currentRank = getUserRank(sessionsCount);
  const nextRank = getNextRank(sessionsCount);
  
  if (!nextRank) {
    return {
      current: sessionsCount,
      next: sessionsCount,
      percentage: 100
    };
  }

  // Calculate progress within the current rank's range
  const progress = sessionsCount - currentRank.minSessions;
  const total = nextRank.minSessions - currentRank.minSessions;
  
  // Calculate percentage with one decimal place for smoother progress
  const percentage = Math.min(Math.max(Math.round((progress / total) * 1000) / 10, 0), 100);

  return {
    current: sessionsCount,
    next: nextRank.minSessions,
    percentage
  };
} 