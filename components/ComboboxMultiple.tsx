"use client";

import { useId, useState, useEffect, useRef } from "react";
import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { useServices } from "@/hooks/use-services"; // Import your new hook

interface Props {
  defaultValues?: string[]; // IDs of services already selected
  onChange?: (values: string[]) => void; // Callback when selection changes
}

export default function ComboboxMultiple({
  defaultValues = [],
  onChange,
}: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const { data: services, isLoading } = useServices(); // Fetch data
  const [selectedValues, setSelectedValues] = useState<string[]>(defaultValues);

  const prevDefaultsString = useRef(JSON.stringify(defaultValues));

  useEffect(() => {
    const currentDefaultsString = JSON.stringify(defaultValues);

    // Only reset local state if the CONTENT from the server actually changed
    if (currentDefaultsString !== prevDefaultsString.current) {
      setSelectedValues(defaultValues);
      prevDefaultsString.current = currentDefaultsString;
    }
  }, [defaultValues]);

  const toggleSelection = (serviceId: string) => {
    const newValues = selectedValues.includes(serviceId)
      ? selectedValues.filter((v) => v !== serviceId)
      : [...selectedValues, serviceId];

    setSelectedValues(newValues);
    if (onChange) onChange(newValues);
  };

  const removeSelection = (serviceId: string) => {
    const newValues = selectedValues.filter((v) => v !== serviceId);
    setSelectedValues(newValues);
    if (onChange) onChange(newValues);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button id={id} aria-expanded={open} className="h-auto px-2">
            <div className="flex flex-wrap items-center gap-1 pr-2">
              {selectedValues.length > 0 ? (
                selectedValues.map((val) => {
                  const service = services?.find((s) => s.id === val);

                  return service ? (
                    <Badge key={val} variant="outline" className="rounded-sm">
                      {service.service}
                      <div
                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSelection(val);
                        }}
                      >
                        <XIcon className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </div>
                    </Badge>
                  ) : null;
                })
              ) : (
                <span className="text-muted-foreground font-normal">
                  {isLoading ? "Loading..." : "Select services"}
                </span>
              )}
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-75 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search services..." />
            <CommandList>
              <CommandEmpty>No service found.</CommandEmpty>
              <CommandGroup>
                {services?.map((service) => (
                  <CommandItem
                    key={service.id}
                    value={service.service} // Use name for searching
                    onSelect={() => toggleSelection(service.id)} // Use ID for value
                  >
                    <span className="truncate">{service.service}</span>
                    {selectedValues.includes(service.id) && (
                      <CheckIcon size={16} className="ml-auto" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
