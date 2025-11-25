import { Rank } from "@/lib/ranks";

interface RankBadgeProps {
  rank: Rank;
  sessionsCount: number;
  nextRank: Rank | null;
  progress: {
    current: number;
    next: number;
    percentage: number;
  };
}

export function RankBadge({ rank, sessionsCount, nextRank, progress }: RankBadgeProps) {
  // Get the next rank's color for the progress bar
  const nextRankColor = nextRank ? nextRank.color.replace('text-', 'bg-') : '';
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 ${rank.color}`}>
        <span className="text-lg">{rank.icon}</span>
        <span className="font-medium">{rank.name}</span>
      </div>
      {nextRank ? (
        <div className="w-full">
          <div className="text-xs text-muted-foreground text-center mb-1">
            {progress.current} / {progress.next} sessions to {nextRank.name}
          </div>
          <div className="relative h-2 w-full rounded-full overflow-hidden">
            {/* Completed progress (solid color) */}
            <div 
              className={`absolute h-full ${nextRankColor} transition-all duration-300 ease-in-out`}
              style={{ 
                width: `${progress.percentage}%`,
                minWidth: '0%',
                maxWidth: '100%'
              }}
            />
            {/* Remaining progress (pale color) */}
            <div 
              className={`absolute h-full ${nextRankColor} transition-all duration-300 ease-in-out opacity-30`}
              style={{ 
                width: `${100 - progress.percentage}%`,
                left: `${progress.percentage}%`,
                minWidth: '0%',
                maxWidth: '100%'
              }}
            />
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground text-center">
          Maximum rank achieved!
        </div>
      )}
    </div>
  );
} 