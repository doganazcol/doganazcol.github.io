"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Course {
  code: string;
}

interface MultiCourseSelectorProps {
  value: string[];
  onChange: (courses: string[]) => void;
}

export function MultiCourseSelector({ value = [], onChange }: MultiCourseSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const loadCourses = useCallback(async (pageNum: number, search: string = "") => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`/api/courses?page=${pageNum}&limit=50&search=${encodeURIComponent(search)}`)
      if (!response.ok) {
        throw new Error('Failed to load courses')
      }
      const data = await response.json()
      
      if (pageNum === 1) {
        setCourses(data.courses)
      } else {
        setCourses(prev => [...prev, ...data.courses])
      }
      
      setHasMore(pageNum < data.totalPages)
    } catch (error) {
      console.error('Error loading courses:', error)
      setError('Failed to load courses. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    setPage(1)
    loadCourses(1, searchQuery)
  }, [searchQuery, loadCourses])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      loadCourses(nextPage, searchQuery)
    }
  }, [page, isLoading, hasMore, loadCourses, searchQuery])

  const toggleCourse = (courseCode: string) => {
    if (value.includes(courseCode)) {
      onChange(value.filter(c => c !== courseCode))
    } else {
      onChange([...value, courseCode])
    }
  }

  const removeCourse = (courseCode: string) => {
    onChange(value.filter(c => c !== courseCode))
  }

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            role="combobox" 
            aria-expanded={open} 
            className="w-full justify-between"
          >
            <span className="truncate">
              {value.length === 0 ? "Select courses..." : `${value.length} course${value.length > 1 ? 's' : ''} selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full md:w-[400px] p-0">
          <Command>
            <CommandInput 
              placeholder="Search courses..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {isLoading && page === 1 ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Loading courses...</span>
                </div>
              ) : error ? (
                <div className="p-4 text-sm text-red-500">{error}</div>
              ) : courses.length === 0 ? (
                <CommandEmpty>No courses found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {courses.map((course) => (
                    <CommandItem
                      key={course.code}
                      value={course.code}
                      onSelect={() => toggleCourse(course.code)}
                    >
                      <Check className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(course.code) ? "opacity-100" : "opacity-0"
                      )} />
                      <span>{course.code}</span>
                    </CommandItem>
                  ))}
                  {hasMore && (
                    <div className="flex items-center justify-center p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadMore}
                        disabled={isLoading}
                        className="w-full"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Loading more...
                          </>
                        ) : (
                          'Load more courses'
                        )}
                      </Button>
                    </div>
                  )}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Selected Courses */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((courseCode) => (
            <Badge key={courseCode} variant="secondary" className="pl-2 pr-1">
              {courseCode}
              <button
                type="button"
                onClick={() => removeCourse(courseCode)}
                className="ml-1 hover:bg-muted rounded-sm p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

