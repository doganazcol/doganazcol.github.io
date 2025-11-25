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
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MultiCourseSelector } from "@/components/multi-course-selector";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  courses: z.array(z.string()).default([]),
  studyTimePreferences: z.array(z.string()).default([]),
  preferredStudyEnvironments: z.array(z.string()).default([]),
  learningStyles: z.array(z.string()).default([]),
  preferredContentTypes: z.array(z.string()).default([]),
  comfortableDifficultyLevels: z.array(z.string()).default([]),
  sessionFrequency: z.string().optional(),
  commitmentLevel: z.string().optional(),
  preferredGroupSize: z.number().min(2).max(10).optional(),
  introvertExtrovert: z.number().min(1).max(5).optional(),
  focusedCollaborative: z.number().min(1).max(5).optional(),
  availableDays: z.array(z.string()).default([]),
  studyGoals: z.array(z.string()).default([]),
});

const studyTimeOptions = [
  { value: 'early-morning', label: 'Early Morning (6-9 AM)' },
  { value: 'morning', label: 'Morning (9 AM-12 PM)' },
  { value: 'afternoon', label: 'Afternoon (12-5 PM)' },
  { value: 'evening', label: 'Evening (5-9 PM)' },
  { value: 'late-night', label: 'Late Night (9 PM+)' },
];

const studyEnvironmentOptions = [
  { value: 'library', label: 'Library' },
  { value: 'cafe', label: 'Café' },
  { value: 'dorm', label: 'Dorm' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'quiet', label: 'Quiet Space' },
  { value: 'collaborative', label: 'Collaborative Space' },
];

const learningStyleOptions = [
  { value: 'visual', label: 'Visual (diagrams, charts)' },
  { value: 'auditory', label: 'Auditory (discussion, lectures)' },
  { value: 'kinesthetic', label: 'Kinesthetic (hands-on)' },
  { value: 'reading-writing', label: 'Reading/Writing' },
];

const contentTypeOptions = [
  { value: 'textbook-review', label: 'Textbook Review' },
  { value: 'midterm-review', label: 'Midterm Review' },
  { value: 'final-review', label: 'Final Review' },
  { value: 'review-of-week', label: 'Review of the Week' },
  { value: 'homework', label: 'Homework' },
  { value: 'projects', label: 'Projects' },
  { value: 'labs', label: 'Labs' },
];

const difficultyLevelOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'medium', label: 'Medium' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'mock-exam', label: 'Mock Exam' },
];

const daysOfWeek = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

const studyGoalOptions = [
  { value: 'exam-prep', label: 'Exam Prep' },
  { value: 'homework-help', label: 'Homework Help' },
  { value: 'project-collab', label: 'Project Collaboration' },
  { value: 'concept-review', label: 'Concept Review' },
  { value: 'study-buddy', label: 'Study Buddy' },
  { value: 'accountability', label: 'Accountability' },
  { value: 'networking', label: 'Networking' },
];

export function MatchingPreferencesForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courses: [],
      studyTimePreferences: [],
      preferredStudyEnvironments: [],
      learningStyles: [],
      preferredContentTypes: [],
      comfortableDifficultyLevels: [],
      availableDays: [],
      studyGoals: [],
      sessionFrequency: undefined,
      commitmentLevel: undefined,
      preferredGroupSize: 4,
      introvertExtrovert: 3,
      focusedCollaborative: 3,
    },
  });

  // Fetch existing preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch('/api/matching/preferences');
        if (response.ok) {
          const data = await response.json();
          if (data.preferences) {
            // Update form with fetched preferences
            Object.keys(data.preferences).forEach(key => {
              const value = data.preferences[key];
              if (value !== undefined && value !== null) {
                form.setValue(key as any, value);
              }
            });
          }
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchPreferences();
  }, [form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      const response = await fetch('/api/matching/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      toast.success('Matching preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading preferences...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Courses */}
        <FormField
          control={form.control}
          name="courses"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Courses You're Taking</FormLabel>
              <FormControl>
                <MultiCourseSelector
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                Select the courses you're currently taking or want study partners for.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Study Time Preferences */}
        <FormField
          control={form.control}
          name="studyTimePreferences"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Preferred Study Times</FormLabel>
                <FormDescription>
                  When do you prefer to study?
                </FormDescription>
              </div>
              <div className="space-y-2">
                {studyTimeOptions.map((time) => (
                  <FormField
                    key={time.value}
                    control={form.control}
                    name="studyTimePreferences"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(time.value)}
                            onCheckedChange={(checked) => {
                              const value = field.value || [];
                              return checked
                                ? field.onChange([...value, time.value])
                                : field.onChange(value.filter((v) => v !== time.value));
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">{time.label}</FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Content Types */}
        <FormField
          control={form.control}
          name="preferredContentTypes"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Preferred Session Content Types</FormLabel>
                <FormDescription>
                  What type of study sessions are you interested in?
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {contentTypeOptions.map((type) => (
                  <FormField
                    key={type.value}
                    control={form.control}
                    name="preferredContentTypes"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(type.value)}
                            onCheckedChange={(checked) => {
                              const value = field.value || [];
                              return checked
                                ? field.onChange([...value, type.value])
                                : field.onChange(value.filter((v) => v !== type.value));
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">{type.label}</FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Difficulty Levels */}
        <FormField
          control={form.control}
          name="comfortableDifficultyLevels"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Comfortable Difficulty Levels</FormLabel>
                <FormDescription>
                  What difficulty levels are you comfortable with?
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {difficultyLevelOptions.map((level) => (
                  <FormField
                    key={level.value}
                    control={form.control}
                    name="comfortableDifficultyLevels"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(level.value)}
                            onCheckedChange={(checked) => {
                              const value = field.value || [];
                              return checked
                                ? field.onChange([...value, level.value])
                                : field.onChange(value.filter((v) => v !== level.value));
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">{level.label}</FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Study Environment */}
        <FormField
          control={form.control}
          name="preferredStudyEnvironments"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Preferred Study Environments</FormLabel>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {studyEnvironmentOptions.map((env) => (
                  <FormField
                    key={env.value}
                    control={form.control}
                    name="preferredStudyEnvironments"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(env.value)}
                            onCheckedChange={(checked) => {
                              const value = field.value || [];
                              return checked
                                ? field.onChange([...value, env.value])
                                : field.onChange(value.filter((v) => v !== env.value));
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">{env.label}</FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Learning Styles */}
        <FormField
          control={form.control}
          name="learningStyles"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Learning Styles</FormLabel>
              </div>
              <div className="space-y-2">
                {learningStyleOptions.map((style) => (
                  <FormField
                    key={style.value}
                    control={form.control}
                    name="learningStyles"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(style.value)}
                            onCheckedChange={(checked) => {
                              const value = field.value || [];
                              return checked
                                ? field.onChange([...value, style.value])
                                : field.onChange(value.filter((v) => v !== style.value));
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">{style.label}</FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Study Goals */}
        <FormField
          control={form.control}
          name="studyGoals"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Study Goals</FormLabel>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {studyGoalOptions.map((goal) => (
                  <FormField
                    key={goal.value}
                    control={form.control}
                    name="studyGoals"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(goal.value)}
                            onCheckedChange={(checked) => {
                              const value = field.value || [];
                              return checked
                                ? field.onChange([...value, goal.value])
                                : field.onChange(value.filter((v) => v !== goal.value));
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">{goal.label}</FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Personality Sliders */}
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="introvertExtrovert"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Introvert ← → Extrovert</FormLabel>
                <FormControl>
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={[field.value || 3]}
                    onValueChange={([value]) => field.onChange(value)}
                    className="mt-2"
                  />
                </FormControl>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Introvert</span>
                  <span>Neutral</span>
                  <span>Extrovert</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="focusedCollaborative"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Independent ← → Collaborative</FormLabel>
                <FormControl>
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={[field.value || 3]}
                    onValueChange={([value]) => field.onChange(value)}
                    className="mt-2"
                  />
                </FormControl>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Independent</span>
                  <span>Balanced</span>
                  <span>Collaborative</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Additional Preferences */}
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="sessionFrequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Session Frequency</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="several-per-week">Several per week</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Biweekly</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="commitmentLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commitment Level</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="serious">Serious</SelectItem>
                    <SelectItem value="intensive">Intensive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="preferredGroupSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Group Size: {field.value || 'Not set'}</FormLabel>
              <FormControl>
                <Slider
                  min={2}
                  max={10}
                  step={1}
                  value={[field.value || 4]}
                  onValueChange={([value]) => field.onChange(value)}
                />
              </FormControl>
              <FormDescription>
                How many people (including you) do you prefer in study sessions?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Available Days */}
        <FormField
          control={form.control}
          name="availableDays"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Available Days</FormLabel>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {daysOfWeek.map((day) => (
                  <FormField
                    key={day}
                    control={form.control}
                    name="availableDays"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(day)}
                            onCheckedChange={(checked) => {
                              const value = field.value || [];
                              return checked
                                ? field.onChange([...value, day])
                                : field.onChange(value.filter((v) => v !== day));
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal capitalize">{day.slice(0, 3)}</FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save Matching Preferences'
          )}
        </Button>
      </form>
    </Form>
  );
}

