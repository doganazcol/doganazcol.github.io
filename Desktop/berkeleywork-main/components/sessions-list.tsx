'use client';

import { useState, useMemo } from 'react';
import { SessionCard } from '@/components/session-card';
import { SessionListItem } from '@/components/session-list-item';
import { ClassroomFilter } from '@/components/classroom-filter';
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from '@/components/ui/input';
import { Search, LayoutGrid, List } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { SessionDetailDialog } from "@/components/session-detail-dialog";
import { CourseSelector } from "@/components/course-selector"

interface SessionsListProps {
  sessions: PopulatedSession[];
}

export interface PopulatedSession { 
  _id: string;
  title: string;
  description: string;
  date: string; 
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  participants: Array<{ user: { _id: string; fullName: string; email: string; image?: string; }; joinedAt: string; }>;
  pendingRequests: Array<{ _id: string; user: { _id: string; fullName: string; email: string; image?: string; }; requestedAt: string; status: 'pending' | 'accepted' | 'rejected'; }>;
  isPrivate: boolean;
  createdBy: { _id: string; fullName: string; email: string; image?: string; };
  createdAt: string;
  updatedAt: string;
  class: string;
}

export function SessionsList({ sessions: initialSessions }: SessionsListProps) {
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSession, setSelectedSession] = useState<PopulatedSession | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sessions, setSessions] = useState<PopulatedSession[]>(initialSessions);

  const classrooms = useMemo(() => {
    const uniqueClassrooms = new Set(sessions.map(s => s.class));
    return Array.from(uniqueClassrooms).sort();
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      const courseMatch = selectedCourse === '' || session.class === selectedCourse;
      const searchMatch = searchQuery === '' ||
        session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.location.toLowerCase().includes(searchQuery.toLowerCase());

      const dateMatch = !selectedDate || 
        new Date(session.date).toDateString() === selectedDate.toDateString();

      return courseMatch && searchMatch && dateMatch;
    });
  }, [sessions, selectedCourse, searchQuery, selectedDate]);

  const handleListItemClick = (session: PopulatedSession) => {
    setSelectedSession(session);
    setIsDialogOpen(true);
  };

  const handleSessionUpdate = (updatedSession: PopulatedSession) => {
    setSessions(prevSessions => 
      prevSessions.map(session => 
        session._id === updatedSession._id ? {
          ...session,
          ...updatedSession,
          participants: updatedSession.participants,
          currentParticipants: updatedSession.currentParticipants,
          pendingRequests: updatedSession.pendingRequests,
        } : session
      )
    );
    setSelectedSession(updatedSession);
  };

  return (
    <div>
       <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
         <div className="relative w-full md:flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
         <div className="flex items-center gap-2 w-full md:w-auto flex-shrink-0 flex-wrap">
           <CourseSelector
             value={selectedCourse}
             onCourseChange={setSelectedCourse}
           />
           <DatePicker 
             date={selectedDate} 
             setDate={setSelectedDate}
             placeholder="Filter by date"
           />
            <ToggleGroup
              type="single"
              defaultValue="grid"
              value={viewMode}
              onValueChange={(value) => {if (value) setViewMode(value as 'grid' | 'list')}}
              aria-label="View mode"
              className="ml-auto md:ml-0"
            >
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
         </div>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No sessions found matching your criteria.
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSessions.map((session) => (
            <SessionCard 
              key={session._id} 
              session={session} 
              onShowDetails={handleListItemClick}
              onUpdate={handleSessionUpdate}
            />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          {filteredSessions.map((session) => (
            <SessionListItem 
              key={session._id} 
              session={session} 
              onClick={() => handleListItemClick(session)}
            />
          ))}
          
          <style jsx>{`
            .border > :global(> div:last-child) {
               border-bottom: none;
             }
          `}</style>
        </div>
      )}

      <SessionDetailDialog
        session={selectedSession}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSessionUpdate={handleSessionUpdate}
      />
    </div>
  );
} 