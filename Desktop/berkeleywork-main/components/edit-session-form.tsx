"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CourseSelector } from "@/components/course-selector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

// Helper function to generate time options
const generateTimeOptions = (intervalMinutes = 30) => {
  const options = [];
  const startHour = 0;
  const endHour = 23;
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      let displayHour = hour % 12;
      if (displayHour === 0) displayHour = 12; // Handle midnight and noon
      const ampm = hour < 12 ? 'AM' : 'PM';
      const label = `${displayHour}:${String(minute).padStart(2, '0')} ${ampm}`;
      options.push({ value, label });
    }
  }
  return options;
};

const timeOptions = generateTimeOptions(30);

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  class: z.string().min(2, {
    message: "Class must be at least 2 characters.",
  }),
  contentType: z.enum(['homework', 'projects', 'midterm-review', 'final-review', 'discussion-review-of-week', 'labs', 'textbook-review']).optional(),
  date: z.date({
    required_error: "A date is required.",
  }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Please enter a valid time in HH:MM format.",
  }),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Please enter a valid time in HH:MM format.",
  }),
  location: z.string().min(2, {
    message: "Location must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  maxParticipants: z.coerce.number().min(2, {
    message: "At least 2 participants are required.",
  }).max(20, {
    message: "Maximum participants cannot exceed 20.",
  }),
});

type StudySession = {
  id: string;
  title: string;
  class: string;
  contentType?: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  maxParticipants: number;
};

interface EditSessionFormProps {
  session: StudySession;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditSessionForm({ session, onSuccess, onCancel }: EditSessionFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: session.title,
      class: session.class,
      contentType: session.contentType as any,
      date: new Date(session.date),
      startTime: session.startTime,
      endTime: session.endTime,
      location: session.location,
      description: session.description,
      maxParticipants: session.maxParticipants,
    },
  });

  const isPastSession = new Date(session.date) < new Date();

  if (isPastSession) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h3 className="mt-4 text-lg font-semibold">Cannot Edit Past Session</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            This session has already occurred and cannot be edited.
          </p>
        </div>
      </div>
    );
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(`/api/sessions/${session.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          date: values.date.toISOString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update study session");
      }

      const updatedSession = await response.json();
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
        router.push(`/sessions/${session.id}`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md">{error}</div>
        )}

        <div className="grid grid-cols-1 gap-8">
          <FormField
            control={form.control}
            name="class"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Class</FormLabel>
                <FormControl>
                  <Input 
                    value={field.value}
                    disabled
                    className="bg-muted"
                  />
                </FormControl>
                <FormDescription>
                  The course cannot be changed after creation.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contentType"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Study Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select study type (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="homework">Homework</SelectItem>
                    <SelectItem value="projects">Project</SelectItem>
                    <SelectItem value="midterm-review">Midterm Exam Review</SelectItem>
                    <SelectItem value="final-review">Final Exam Review</SelectItem>
                    <SelectItem value="review-of-week">Weekly Discussion Review</SelectItem>
                    <SelectItem value="labs">Lab Work</SelectItem>
                    <SelectItem value="textbook-review">Textbook Review</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  What type of study session is this?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Study session title" {...field} />
                </FormControl>
                <FormDescription>
                  Give your study session a descriptive title.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Start Time</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="pl-3 text-left font-normal">
                          <SelectValue placeholder="Select start time">
                            {timeOptions.find(option => option.value === field.value)?.label || field.value}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {timeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>End Time</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="pl-3 text-left font-normal">
                          <SelectValue placeholder="Select end time">
                            {timeOptions.find(option => option.value === field.value)?.label || field.value}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {timeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Study session location" {...field} />
                </FormControl>
                <FormDescription>
                  Enter where the study session will take place.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe what you'll be studying..."
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide details about what will be covered in the study session.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxParticipants"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Maximum Participants</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value)}
                  defaultValue={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select max participants" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.from({ length: 19 }, (_, i) => i + 2).map((num) => (
                      <SelectItem key={String(num)} value={String(num)}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the maximum number of participants (including yourself).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
} 