"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CourseSelector } from "@/components/course-selector"
import { CreateSessionDialog } from "@/components/create-session-dialog"
import { SessionDetailDialog } from "@/components/session-detail-dialog"

interface StudySession {
  _id: string;
  title: string;
  class: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  maxParticipants: number;
  currentParticipants: number;
  participants: Array<{
    user: {
      _id: string;
      fullName: string;
      email: string;
      image?: string;
    };
    joinedAt: string;
  }>;
  pendingRequests: Array<{
    _id: string;
    user: {
      _id: string;
      fullName: string;
      email: string;
      image?: string;
    };
    requestedAt: string;
    status: 'pending' | 'accepted' | 'rejected';
  }>;
  isPrivate: boolean;
  createdBy: {
    _id: string;
    fullName: string;
    email: string;
    image?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CalendarContentProps {
  sessions: StudySession[];
}

export function CalendarContent({ sessions }: CalendarContentProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showSessionDialog, setShowSessionDialog] = useState(false)

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleDateClick = (date: Date | null) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  const handleSessionClick = (session: StudySession) => {
    setSelectedSession(session)
    setShowSessionDialog(true)
  }

  // Filter sessions by selected class
  const filteredSessions = useMemo(() => {
    if (!selectedCourse) return sessions;
    return sessions.filter(session => 
      session.class === selectedCourse || 
      session.class.includes(selectedCourse)
    );
  }, [sessions, selectedCourse]);

  // Get all days in the current month
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get sessions for the selected date or today if no date is selected
  const displayDate = selectedDate || new Date()
  const displayDateSessions = filteredSessions.filter(session => 
    isSameDay(new Date(session.date), displayDate)
  )

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container py-10">
        <div className="grid gap-6 md:grid-cols-3 md:items-start">
          <div className="md:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">Previous month</span>
                    </Button>
                    <CardTitle>
                      {format(currentMonth, "MMMM yyyy")}
                    </CardTitle>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                      <ChevronRight className="h-4 w-4" />
                      <span className="sr-only">Next month</span>
                    </Button>
                  </div>
                  <CourseSelector 
                    value={selectedCourse}
                    onCourseChange={setSelectedCourse}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-sm font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, index) => (
                    <div
                      key={day.toISOString()}
                      className={`
                        aspect-square p-1 relative
                        transition-all duration-200 ease-in-out
                        ${!isSameMonth(day, currentMonth) ? "text-muted-foreground/30" : ""}
                        ${isSameDay(day, new Date()) ? "bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-md" : ""}
                        ${selectedDate && isSameDay(day, selectedDate) ? "bg-primary/20 border-2 border-primary rounded-md scale-105" : ""}
                        cursor-pointer hover:bg-primary/10 hover:scale-105 rounded-md
                        group
                      `}
                      onClick={() => handleDateClick(day)}
                    >
                      <div className="h-full w-full flex items-center justify-center">
                        <span className={`
                          text-sm
                          ${selectedDate && isSameDay(day, selectedDate) ? "font-semibold text-primary" : ""}
                          ${isSameDay(day, new Date()) ? "font-semibold text-green-600 dark:text-green-400" : ""}
                        `}>
                          {format(day, "d")}
                        </span>
                      </div>
                      {filteredSessions.some(session => 
                        isSameDay(new Date(session.date), day)
                      ) && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                          <div className={`
                            h-1.5 w-1.5 rounded-full
                            ${isSameDay(day, new Date()) ? "bg-green-500 group-hover:bg-green-600" : "bg-primary group-hover:bg-primary/80"}
                            transition-colors
                          `}></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedDate && isSameDay(selectedDate, new Date()) 
                    ? "Today's Sessions" 
                    : "Available Sessions"}
                </CardTitle>
                <CardDescription>
                  {format(displayDate, "EEEE, MMMM d")}
                  {selectedCourse && <span className="ml-1">• {selectedCourse}</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[600px] overflow-y-auto p-4 space-y-3">
                {displayDateSessions.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No study sessions scheduled for {selectedDate ? "this date" : "today"}
                    {selectedCourse && <span> in {selectedCourse}</span>}
                  </div>
                ) : (
                  displayDateSessions.map((session) => (
                    <div key={session._id} className="rounded-lg border p-3 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-md text-sm font-medium truncate max-w-[70%]">
                          {session.class}
                        </div>
                        <div className="text-sm text-muted-foreground">{session.startTime}</div>
                      </div>
                      <h3 className="font-medium mt-2 truncate">{session.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 truncate">{session.location}</p>
                      <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => handleSessionClick(session)}>
                        View Details
                      </Button>
                    </div>
                  ))
                )}
                <Button className="w-full mt-2" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Session
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Dialogs */}
      <CreateSessionDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
      <SessionDetailDialog 
        session={selectedSession} 
        open={showSessionDialog} 
        onOpenChange={setShowSessionDialog} 
      />
    </div>
  )
} 