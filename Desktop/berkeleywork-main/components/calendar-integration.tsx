"use client"

import { Button } from "@/components/ui/button"
import { Calendar, Apple } from "lucide-react"

interface CalendarIntegrationProps {
  title: string
  description: string
  startTime: string
  endTime: string
  location: string
  date: string
}

export function CalendarIntegration({
  title,
  description,
  startTime,
  endTime,
  location,
  date
}: CalendarIntegrationProps) {
  // Format date and time for calendar links
  const formatDateForCalendar = (date: string, time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const eventDate = new Date(date)
    eventDate.setHours(hours, minutes)
    return eventDate.toISOString().replace(/-|:|\.\d+/g, '')
  }

  const startDateTime = formatDateForCalendar(date, startTime)
  const endDateTime = formatDateForCalendar(date, endTime)

  // Generate Google Calendar link
  const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render')
  googleCalendarUrl.searchParams.append('action', 'TEMPLATE')
  googleCalendarUrl.searchParams.append('text', title)
  googleCalendarUrl.searchParams.append('details', description)
  googleCalendarUrl.searchParams.append('location', location)
  googleCalendarUrl.searchParams.append('dates', `${startDateTime}/${endDateTime}`)

  // Generate Apple Calendar link
  const appleCalendarUrl = `data:text/calendar;charset=utf8,BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${startDateTime}
DTEND:${endDateTime}
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${location}
END:VEVENT
END:VCALENDAR`

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => window.open(googleCalendarUrl.toString(), '_blank')}
      >
        <Calendar className="h-4 w-4" />
        Add to Google Calendar
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => {
          const link = document.createElement('a')
          link.href = appleCalendarUrl
          link.download = 'study-session.ics'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }}
      >
        <Apple className="h-4 w-4" />
        Add to Apple Calendar
      </Button>
    </div>
  )
} 