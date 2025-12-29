"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Props {
  placeholder: string;
  list: any[]; // Defined as an array
  defaultValue?: string; // <--- Add this
  onSelect?: (id: string) => void; // Optional: Pass selection back to parent
}

export function ComboboxInputCalendar({
  placeholder,
  list = [],
  defaultValue,
  onSelect,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(defaultValue);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {/* FIX 1: Look inside 'list', not 'frameworks' */}
          {value
            ? list.find((item) => item.id === value)
              ? `${list.find((item) => item.id === value).first_name} ${
                  list.find((item) => item.id === value).last_name
                }`
              : `Select ${placeholder}`
            : `Select ${placeholder}`}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0">
        <Command>
          <CommandInput placeholder={`Select ${placeholder}`} className="h-9" />
          <CommandList>
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup>
              {list?.map((item: any) => (
                <CommandItem
                  key={item.id}
                  value={`${item.first_name} ${item.last_name}`}
                  onSelect={() => {
                    const newValue = value === item.id ? "" : item.id;
                    setValue(newValue);
                    setOpen(false);
                    if (onSelect) onSelect(newValue);
                  }}
                >
                  {item.first_name} {item.last_name}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === item.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
