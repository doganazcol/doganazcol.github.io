"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface Course {
  code: string;
}

// Add alias mapping
const COURSE_ALIASES: Record<string, string[]> = {
  'COMPSCI': ['CS'],
  'MCELLBI': ['MCB'],
  'DATA C140': ['DATA']
};

// Helper function to get aliases for a course code
const getCourseAliases = (code: string): string[] => {
  const aliases: string[] = [];
  
  // Check for department aliases
  const [dept, number] = code.split(' ');
  if (dept && COURSE_ALIASES[dept]) {
    aliases.push(...COURSE_ALIASES[dept].map(alias => `${alias} ${number}`));
  }
  
  // Check for full course code aliases
  if (COURSE_ALIASES[code]) {
    aliases.push(...COURSE_ALIASES[code]);
  }
  
  return aliases;
};

interface CourseSelectorProps {
  onCourseChange?: (courseCode: string) => void;
  value?: string;
  showAllClasses?: boolean;
}

export function CourseSelector({ onCourseChange, value = "", showAllClasses = true }: CourseSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCourses, setTotalCourses] = useState(0)

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
      
      setTotalCourses(data.total)
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

  const filteredCourses = useMemo(() => {
    return courses
  }, [courses])

  const selectedCourse = courses.find(course => course.code === value)

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            role="combobox" 
            aria-expanded={open} 
            className="w-full md:w-[250px] justify-between transition-all duration-200
              hover:bg-accent/5 hover:border-primary/50
              focus-visible:ring-1 focus-visible:ring-primary/20"
          >
            <span className="truncate max-w-[200px]">
              {value ? selectedCourse?.code : "All Classes"}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-full md:w-[300px] p-0 transition-all duration-200 ease-in-out
            data-[state=open]:animate-in data-[state=closed]:animate-out
            data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
            data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <Command>
            <CommandInput 
              placeholder="Search courses..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="border-none focus:ring-0 focus:outline-none"
            />
            <CommandList>
              {isLoading && page === 1 ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Loading courses...</span>
                </div>
              ) : error ? (
                <div className="p-4 text-sm text-red-500">{error}</div>
              ) : filteredCourses.length === 0 ? (
                <CommandEmpty>No courses found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {showAllClasses && (
                    <CommandItem
                      key="all"
                      value=""
                      onSelect={() => {
                        if (onCourseChange) {
                          onCourseChange("")
                        }
                        setOpen(false)
                      }}
                      className="transition-colors duration-200 hover:bg-primary/10 rounded-md mx-1
                        data-[selected=true]:bg-primary/20 data-[selected=true]:text-primary"
                    >
                      <Check className={cn(
                        "mr-2 h-4 w-4 transition-opacity duration-200",
                        value === "" ? "opacity-100" : "opacity-0"
                      )} />
                      <div className="flex flex-col">
                        <span className="font-medium">All Classes</span>
                      </div>
                    </CommandItem>
                  )}
                  {filteredCourses.map((course) => (
                    <CommandItem
                      key={course.code}
                      value={course.code}
                      onSelect={() => {
                        if (onCourseChange) {
                          onCourseChange(course.code)
                        }
                        setOpen(false)
                      }}
                      className="transition-colors duration-200 hover:bg-primary/10 rounded-md mx-1
                        data-[selected=true]:bg-primary/20 data-[selected=true]:text-primary"
                    >
                      <Check className={cn(
                        "mr-2 h-4 w-4 transition-opacity duration-200",
                        value === course.code ? "opacity-100" : "opacity-0"
                      )} />
                      <div className="flex flex-col">
                        <span className="font-medium">{course.code}</span>
                      </div>
                    </CommandItem>
                  ))}
                  {hasMore && (
                    <div className="flex items-center justify-center p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadMore}
                        disabled={isLoading}
                        className="w-full transition-colors hover:bg-primary/10"
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
    </div>
  )
} 