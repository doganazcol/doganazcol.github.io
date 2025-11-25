"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CLASS_OPTIONS } from "@/lib/constants"

interface ClassSelectorProps {
  onClassChange?: (className: string) => void;
}

export function ClassSelector({ onClassChange }: ClassSelectorProps = {}) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("all")

  const handleSelect = (currentValue: string) => {
    const newValue = currentValue === value ? "" : currentValue;
    setValue(newValue);
    setOpen(false);
    
    if (onClassChange) {
      // Pass the actual class name, not the 'all' value
      onClassChange(newValue === 'all' ? '' : newValue);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full md:w-[250px] justify-between">
          <span className="truncate max-w-[200px]">
            {value ? CLASS_OPTIONS.find((c) => c.value === value)?.label : "Select class..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full md:w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search classes..." />
          <CommandList>
            <CommandEmpty>No class found.</CommandEmpty>
            <CommandGroup>
              {CLASS_OPTIONS.map((c) => (
                <CommandItem
                  key={c.value}
                  value={c.value}
                  onSelect={handleSelect}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === c.value ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{c.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

