import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const filePath = path.join(process.cwd(), 'data', 'filtered_berkeley_courses.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    let courses = JSON.parse(fileContents);
    
    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase().trim();
      courses = courses.filter((course: any) => {
        const courseLower = course.code.toLowerCase();
        const aliases = getCourseAliases(course.code).map(a => a.toLowerCase());
        
        // Check if the search term matches the course code or its aliases
        const matchesCourse = courseLower.includes(searchLower);
        const matchesAlias = aliases.some(alias => alias.includes(searchLower));
        
        // Handle partial matches (e.g., "Data 100" for "Data C100")
        const [searchDept, searchNum] = searchLower.split(' ');
        const [courseDept, courseNum] = courseLower.split(' ');
        
        const matchesPartial = searchDept && searchNum && 
          courseDept.includes(searchDept) && 
          courseNum.replace(/[^0-9]/g, '') === searchNum.replace(/[^0-9]/g, '');
        
        return matchesCourse || matchesAlias || matchesPartial;
      });
    }
    
    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCourses = courses.slice(startIndex, endIndex);
    
    return NextResponse.json({
      courses: paginatedCourses,
      total: courses.length,
      page,
      totalPages: Math.ceil(courses.length / limit)
    });
  } catch (error) {
    console.error('Error reading courses:', error);
    return NextResponse.json({ error: 'Failed to load courses' }, { status: 500 });
  }
} 