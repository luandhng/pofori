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
import { UserCircleIcon } from "@phosphor-icons/react/dist/ssr";

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
      <PopoverTrigger asChild className="col-span-3">
        <button
          aria-expanded={open}
          className="w-fit flex items-center gap-1.5 hover:bg-neutral-100 cursor-pointer py-1 px-2 rounded-md text-xs border-none shadow-none justify-between"
        >
          <UserCircleIcon size={15} weight="fill" />
          {/* FIX 1: Look inside 'list', not 'frameworks' */}
          {value
            ? list.find((item) => item.id === value)
              ? `${list.find((item) => item.id === value).first_name} ${
                  list.find((item) => item.id === value).last_name
                }`
              : `Select ${placeholder}`
            : `Select ${placeholder}`}
          {/* <ChevronsUpDown className="opacity-50" /> */}
        </button>
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
                  value={`${
                    item.first_name.charAt(0).toUpperCase() +
                    item.first_name.slice(1)
                  } ${
                    item.last_name.charAt(0).toUpperCase() +
                    item.last_name.slice(1)
                  }`}
                  onSelect={() => {
                    const newValue = value === item.id ? "" : item.id;
                    setValue(newValue);
                    setOpen(false);
                    if (onSelect) onSelect(newValue);
                  }}
                >
                  <span className="flex flex-col">
                    <span>
                      {item.first_name.charAt(0).toUpperCase() +
                        item.first_name.slice(1)}{" "}
                      {item.last_name.charAt(0).toUpperCase() +
                        item.last_name.slice(1)}
                    </span>
                    {placeholder === "customers" && (
                      <span className="text-xs opacity-50">
                        {item.phone_number}
                      </span>
                    )}
                  </span>
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
