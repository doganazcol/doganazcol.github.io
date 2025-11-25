"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const commonMajors = [
  "Computer Science",
  "Business Administration",
  "Engineering",
  "Biology",
  "Psychology",
  "Economics",
  "Mathematics",
  "Chemistry",
  "Physics",
  "Political Science",
  "English",
  "History",
  "Sociology",
  "Communications",
  "Marketing",
  "Finance",
  "Accounting",
  "Environmental Science",
  "Public Health",
  "Nursing",
  "Architecture",
  "Art History",
  "Music",
  "Philosophy",
  "Anthropology",
  "Geography",
  "Linguistics",
  "Journalism",
  "Criminal Justice",
  "Education",
  "Social Work",
  "International Relations",
  "Urban Studies",
  "Film Studies",
  "Theater",
  "Dance",
  "Nutrition",
  "Kinesiology",
  "Astronomy",
  "Geology",
  "Neuroscience",
  "Biochemistry",
  "Data Science",
  "Information Systems",
  "Cybersecurity",
  "Robotics",
  "Aerospace Engineering",
  "Civil Engineering",
  "Mechanical Engineering",
  "Electrical Engineering"
];

const formSchema = z.object({
  fullName: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  class: z.enum(['freshman', 'sophomore', 'junior', 'senior'], {
    required_error: "Please select your class.",
  }),
  majors: z.array(z.string()).min(1, {
    message: "Please select at least one major.",
  }).max(2, {
    message: "You can select up to two majors.",
  }),
  interests: z.string().min(2, {
    message: "Please enter at least one interest.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  instagram: z.string().optional(),
});

interface ProfileSetupFormProps {
  initialData?: {
    fullName: string;
    class: string;
    majors: string[];
    interests: string;
    description: string;
    instagram?: string;
  };
  isEditing?: boolean;
}

export function ProfileSetupForm({ initialData, isEditing = false }: ProfileSetupFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMajors, setSelectedMajors] = useState<string[]>(initialData?.majors || []);

  // Initialize form with initial data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: initialData?.fullName || "",
      class: initialData?.class as 'freshman' | 'sophomore' | 'junior' | 'senior' || "freshman",
      majors: initialData?.majors || [],
      interests: initialData?.interests || "",
      description: initialData?.description || "",
      instagram: initialData?.instagram || "",
    },
  });

  // Update selected majors when initial data changes
  useEffect(() => {
    if (initialData?.majors) {
      setSelectedMajors(initialData.majors);
      form.setValue('majors', initialData.majors);
    }
  }, [initialData, form]);

  const handleMajorSelect = (value: string) => {
    if (selectedMajors.includes(value)) {
      const updatedMajors = selectedMajors.filter(major => major !== value);
      setSelectedMajors(updatedMajors);
      form.setValue('majors', updatedMajors);
    } else if (selectedMajors.length < 2) {
      const updatedMajors = [...selectedMajors, value];
      setSelectedMajors(updatedMajors);
      form.setValue('majors', updatedMajors);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      setError(null);

      // Convert comma-separated strings to arrays and trim whitespace
      const interests = values.interests
        .split(',')
        .map(interest => interest.trim())
        .filter(interest => interest.length > 0);

      // Prepare the data to be sent
      const profileData = {
        fullName: values.fullName,
        class: values.class,
        majors: values.majors,
        interests: interests,
        description: values.description,
        instagram: values.instagram?.trim() || null,
      };

      console.log('Form values:', values);
      console.log('Prepared profile data:', profileData);

      const response = await fetch("/api/profile", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      const responseData = await response.json();
      console.log('API Response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to save profile");
      }

      // Force a hard refresh of the page
      window.location.href = "/profile";
    } catch (error) {
      console.error('Error saving profile:', error);
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md">{error}</div>
        )}

        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="class"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your class" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="freshman">Freshman</SelectItem>
                  <SelectItem value="sophomore">Sophomore</SelectItem>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="majors"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Major(s)</FormLabel>
              <Select onValueChange={handleMajorSelect}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select up to two majors" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {commonMajors.map((major) => (
                    <SelectItem 
                      key={major} 
                      value={major}
                      disabled={!selectedMajors.includes(major) && selectedMajors.length >= 2}
                    >
                      {major}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select up to two majors. {selectedMajors.length}/2 selected
              </FormDescription>
              {selectedMajors.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedMajors.map((major) => (
                    <div
                      key={major}
                      className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-md text-sm flex items-center gap-1"
                    >
                      {major}
                      <button
                        type="button"
                        onClick={() => handleMajorSelect(major)}
                        className="text-primary hover:text-primary/80"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="interests"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interests</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Software Engineering, Finance, Data Science" {...field} />
              </FormControl>
              <FormDescription>
                Enter your interests, separated by commas.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about yourself..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="instagram"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instagram Username</FormLabel>
              <FormControl>
                <Input placeholder="Your Instagram username (without @)" {...field} />
              </FormControl>
              <FormDescription>
                Enter your Instagram username to connect with other students.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : (isEditing ? "Save Changes" : "Create Profile")}
        </Button>
      </form>
    </Form>
  );
} 