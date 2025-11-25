import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(timeString: string | undefined | null): string {
  if (!timeString) return "";
  try {
    const [hourStr, minuteStr] = timeString.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    
    if (isNaN(hour) || isNaN(minute)) return timeString; // Return original if invalid

    const date = new Date();
    date.setHours(hour, minute);
    
    return format(date, 'h:mm a'); // Format like "9:30 AM"
  } catch (error) {
    console.error("Error formatting time:", error);
    return timeString; // Return original on error
  }
}

