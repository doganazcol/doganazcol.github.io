'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CLASSES } from '@/lib/constants';

interface ClassroomFilterProps {
  classrooms: string[];
  selectedClassroom: string;
  onClassroomChange: (classroom: string) => void;
}

export function ClassroomFilter({
  classrooms,
  selectedClassroom,
  onClassroomChange,
}: ClassroomFilterProps) {
  const [open, setOpen] = useState(false);
  
  // Combine dynamic classrooms with predefined classes
  const allClassrooms = Array.from(
    new Set([...CLASSES, ...classrooms])
  ).sort();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[250px] justify-between"
        >
          <span className="truncate max-w-[200px]">
            {selectedClassroom || "All Classes"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search classroom..." />
          <CommandEmpty>No classroom found.</CommandEmpty>
          <CommandGroup>
            <CommandItem
              key="all"
              value="all"
              onSelect={() => {
                onClassroomChange('');
                setOpen(false);
              }}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  !selectedClassroom ? "opacity-100" : "opacity-0"
                )}
              />
              All Classes
            </CommandItem>
            {allClassrooms.map((classroom) => (
              <CommandItem
                key={classroom}
                value={classroom}
                onSelect={() => {
                  onClassroomChange(classroom);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedClassroom === classroom ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="truncate">{classroom}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 