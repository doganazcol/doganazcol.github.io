import { format } from 'date-fns';
import { CalendarDays, Clock, MapPin, Users, ChevronRight, Lock } from 'lucide-react';
import { PopulatedSession } from './sessions-list'; // Assuming PopulatedSession is exported
import { formatTime } from "@/lib/utils";

interface SessionListItemProps {
  session: PopulatedSession;
  onClick: () => void; // Add onClick prop
}

export function SessionListItem({ session, onClick }: SessionListItemProps) {
  return (
    <div 
      onClick={onClick} 
      className="block hover:bg-muted/50 transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 flex-grow">
          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold truncate">{session.title}</p>
            <p className="text-sm text-primary">{session.class}</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 sm:mt-0 flex-wrap">
             <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {format(new Date(session.date), 'MMM d, yyyy')}
            </span>
             <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {formatTime(session.startTime)} - {formatTime(session.endTime)}
            </span>
             <span className="flex items-center gap-1.5 hidden md:flex"> {/* Hide on smaller screens */}
              <MapPin className="h-4 w-4" />
              {session.location}
            </span>
             <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {session.currentParticipants}/{session.maxParticipants}
            </span>
             {session.isPrivate && (
               <span className="flex items-center gap-1.5 text-orange-600" title="Private Session">
                 <Lock className="h-4 w-4" />
               </span>
             )}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground ml-4" />
      </div>
    </div>
  );
} 