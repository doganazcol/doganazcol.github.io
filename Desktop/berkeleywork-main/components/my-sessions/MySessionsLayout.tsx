"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SessionCard } from "@/components/session-card"
import { SessionDetailDialog } from "@/components/session-detail-dialog"
import { CalendarDays, Users, LayoutGrid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { SessionListItem } from "@/components/session-list-item"

interface MySessionsLayoutProps {
  createdSessions: any[]
  joinedSessions: any[]
  pastSessions: any[]
}

export function MySessionsLayout({ 
  createdSessions, 
  joinedSessions,
  pastSessions
}: MySessionsLayoutProps) {
  const [activeTab, setActiveTab] = useState("created")
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sessions, setSessions] = useState({
    created: createdSessions,
    joined: joinedSessions,
    past: pastSessions
  })

  const handleSessionClick = (session: any) => {
    setSelectedSession(session)
    setIsDialogOpen(true)
  }

  const handleSessionUpdate = (updatedSession: any) => {
    setSessions(prev => ({
      ...prev,
      created: prev.created.map((s: any) => 
        s._id === updatedSession._id ? updatedSession : s
      ),
      joined: prev.joined.map((s: any) => 
        s._id === updatedSession._id ? updatedSession : s
      ),
      past: prev.past.map((s: any) => 
        s._id === updatedSession._id ? updatedSession : s
      )
    }))
    setSelectedSession(updatedSession)
  }

  const renderSessions = (sessions: any[]) => {
    if (sessions.length === 0) return null;

    if (viewMode === 'grid') {
      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <SessionCard
              key={session._id}
              session={session}
              onShowDetails={handleSessionClick}
              onUpdate={handleSessionUpdate}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="border rounded-lg overflow-hidden">
        {sessions.map((session) => (
          <SessionListItem
            key={session._id}
            session={session}
            onClick={() => handleSessionClick(session)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Study Sessions</h1>
          <p className="text-muted-foreground mt-2">
            Manage your study sessions and track your learning journey
          </p>
        </div>
        <ToggleGroup
          type="single"
          defaultValue="grid"
          value={viewMode}
          onValueChange={(value) => {if (value) setViewMode(value as 'grid' | 'list')}}
          aria-label="View mode"
        >
          <ToggleGroupItem value="grid" aria-label="Grid view">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="created">
            Created Sessions
            <Badge variant="secondary" className="ml-2">
              {createdSessions.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="joined">
            Joined Sessions
            <Badge variant="secondary" className="ml-2">
              {joinedSessions.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="past">
            Past Sessions
            <Badge variant="secondary" className="ml-2">
              {pastSessions.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="created" className="mt-6">
          {createdSessions.length > 0 ? (
            renderSessions(sessions.created)
          ) : (
            <EmptyState
              icon={<CalendarDays className="h-8 w-8" />}
              title="No sessions created yet"
              description="Create your first study session to help others learn"
              action={
                <Button asChild>
                  <Link href="/create">Create Session</Link>
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="joined" className="mt-6">
          {joinedSessions.length > 0 ? (
            renderSessions(sessions.joined)
          ) : (
            <EmptyState
              icon={<CalendarDays className="h-8 w-8" />}
              title="No sessions joined yet"
              description="Browse available sessions to find one that matches your needs"
              action={
                <Button asChild>
                  <Link href="/sessions">Browse Sessions</Link>
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {pastSessions.length > 0 ? (
            renderSessions(sessions.past)
          ) : (
            <EmptyState
              icon={<CalendarDays className="h-8 w-8" />}
              title="No past sessions"
              description="Your past study sessions will appear here"
              action={null}
            />
          )}
        </TabsContent>
      </Tabs>

      <SessionDetailDialog
        session={selectedSession}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSessionUpdate={handleSessionUpdate}
      />
    </div>
  )
}

// Empty State Component
function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode
  title: string
  description: string
  action: React.ReactNode | null
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-3 mb-4">{icon}</div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-muted-foreground mt-1 mb-4 max-w-md">{description}</p>
      {action}
    </div>
  )
} 