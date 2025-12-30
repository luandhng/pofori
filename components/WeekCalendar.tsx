"use client";

import { useState, useEffect, useRef } from "react";
import {
  format,
  addDays,
  subDays,
  isSameDay,
  isToday,
  getHours,
  getMinutes,
  setHours,
  setMinutes,
  differenceInMinutes,
  addMinutes,
} from "date-fns";
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeft,
  ChevronRight,
  Clock8Icon,
} from "lucide-react";
import { useTechnicians } from "@/hooks/use-technicians";
import { useCustomers } from "@/hooks/use-customers";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Input } from "./ui/input";
import { ComboboxInputCalendar } from "./ComboboxInputCalendar";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import ComboboxMultiple from "./ComboboxMultiple";
import { useUpdateAppointment } from "@/hooks/use-update-appointment";
import { useSyncServices } from "@/hooks/use-insert-appointment-services";
import { useServices } from "@/hooks/use-services";
import { Label } from "./ui/label";
import {
  CalendarDotIcon,
  ClockIcon,
  UserCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

// --- CONFIG ---
const CELL_HEIGHT = 60;
const HOURS_IN_DAY = 24;
const GRID_TOTAL_HEIGHT = HOURS_IN_DAY * CELL_HEIGHT;
const SNAP_MINUTES = 15;

// --- TYPES ---
export type CalendarEvent = {
  id: string;
  technician_id: string;
  time: Date;
  end: Date;
  customer_id: string;
  appointment_services: AppointmentService[];
  color?: string;
};

interface AppointmentService {
  id: string;
  services: Service;
}

interface Service {
  id: string;
  service: string;
}

interface DayCalendarProps {
  events?: CalendarEvent[];
  initialDate?: Date;
}

export function WeekCalendar({
  events = [],
  initialDate = new Date(),
}: DayCalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- STATE & REFS ---
  // We use a ref for drag data because dataTransfer is not accessible during 'dragOver'
  const dragRef = useRef<{
    id: string;
    offsetY: number;
    duration: number;
    originalTime: Date;
  } | null>(null);

  const [dropIndicator, setDropIndicator] = useState<{
    techId: string;
    time: Date;
    duration: number;
  } | null>(null);

  const { data: technicians, isLoading: isLoadingTechs } = useTechnicians();
  const { data: customers } = useCustomers();
  const { data: services } = useServices();
  const { mutate } = useUpdateAppointment();
  const syncServices = useSyncServices(services || []);

  useEffect(() => {
    setCurrentTime(new Date());
    const timerId = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timerId);
  }, []);

  const nextDay = () => setCurrentDate(addDays(currentDate, 1));
  const prevDay = () => setCurrentDate(subDays(currentDate, 1));
  const jumpToToday = () => setCurrentDate(new Date());

  const hours = Array.from({ length: HOURS_IN_DAY }, (_, i) => i);

  // --- HELPER: TIME CALCULATION ---
  const getVerticalPosition = (date: Date) => {
    const h = getHours(date);
    const m = getMinutes(date);
    return (h * 60 + m) * (CELL_HEIGHT / 60);
  };

  const calculateSnappedTime = (
    clientY: number,
    columnTop: number,
    offsetY: number
  ) => {
    // 1. Where is the mouse inside the column?
    const relativeY = clientY - columnTop;

    // 2. Adjust for where we grabbed the box (so the top of the box lands where we want)
    const adjustedY = relativeY - offsetY;

    // 3. Convert to minutes
    const pixelsPerMinute = CELL_HEIGHT / 60;
    const rawMinutes = adjustedY / pixelsPerMinute;

    // 4. Snap
    const snappedMinutes = Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES;
    const safeMinutes = Math.max(0, Math.min(snappedMinutes, 24 * 60));

    // 5. Create Date
    const h = Math.floor(safeMinutes / 60);
    const m = safeMinutes % 60;
    return setMinutes(setHours(new Date(currentDate), h), m);
  };

  // --- DRAG HANDLERS ---

  const handleDragStart = (
    e: React.DragEvent,
    id: string,
    startTime: Date,
    endTime: Date
  ) => {
    // Calculate offset: Mouse Y - Box Top Y
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const duration = differenceInMinutes(endTime, startTime);

    // Store in Ref (accessible everywhere immediately)
    dragRef.current = { id, offsetY, duration, originalTime: startTime };

    // Set drag image (optional, browsers do this automatically but this helps consistency)
    e.dataTransfer.effectAllowed = "move";

    // Optional: Hide the original element visually if you want,
    // but usually better to keep it opacity-50 via CSS classes below.
  };

  const handleDragOver = (e: React.DragEvent, techId: string) => {
    e.preventDefault(); // MANDATORY
    e.dataTransfer.dropEffect = "move";

    if (!dragRef.current) return;

    const columnRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const newTime = calculateSnappedTime(
      e.clientY,
      columnRect.top,
      dragRef.current.offsetY
    );

    // Only update state if time or column changed to prevent infinite re-renders
    setDropIndicator((prev) => {
      if (
        prev &&
        prev.techId === techId &&
        prev.time.getTime() === newTime.getTime()
      ) {
        return prev;
      }
      return { techId, time: newTime, duration: dragRef.current!.duration };
    });
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // We don't clear immediately on leave because it flickers when crossing child elements (like the ghost box)
    // The ghost box has 'pointer-events-none' to help this, but it's safer to clear on drop or dragEnd.
  };

  const handleDrop = (e: React.DragEvent, techId: string) => {
    e.preventDefault();

    if (!dragRef.current) return;

    const { id, offsetY } = dragRef.current;
    const columnRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const newStartTime = calculateSnappedTime(
      e.clientY,
      columnRect.top,
      offsetY
    );

    mutate({
      id: id,
      updates: {
        technician_id: techId,
        time: newStartTime.toISOString(),
      },
    });

    // Cleanup happens in dragEnd
  };

  const handleDragEnd = () => {
    dragRef.current = null;
    setDropIndicator(null);
  };

  const currentTimeTop = getVerticalPosition(currentTime);
  const showCurrentTimeLine = isToday(currentDate);

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 bg-white z-30 relative">
        <h2 className="text-sm font-bold tracking-tight">
          {format(currentDate, "d MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={jumpToToday}>
            Today
          </Button>
          <div className="flex items-center border rounded-md ml-2">
            <button onClick={prevDay} className="p-1.5 border-r ">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextDay} className="p-1.5 ">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* TECH HEADER */}
      <div className="flex border-b border-slate-200 sticky top-0 z-20 bg-white">
        <div className="w-20 min-w-20 border-slate-200" />
        <div className="flex flex-1">
          {isLoadingTechs && (
            <div className="flex-1 p-2 text-sm text-gray-400 italic">
              Loading...
            </div>
          )}
          {technicians?.map((tech) => (
            <div key={tech.id} className="flex-1 pb-2 text-center">
              {tech.first_name.charAt(0).toUpperCase() +
                tech.first_name.slice(1).toLowerCase() +
                " " +
                tech.last_name.charAt(0).toUpperCase() +
                tech.last_name.slice(1).toLowerCase()}
            </div>
          ))}
        </div>
      </div>

      {/* GRID SCROLL AREA */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar bg-white">
        <div className="flex min-w-full relative">
          {/* TIME AXIS */}
          <div className="w-20 min-w-20 bg-white border-r border-slate-200 sticky left-0 z-30">
            <div
              className="relative"
              style={{ height: `${GRID_TOTAL_HEIGHT}px` }}
            >
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute w-full text-neutral-500 text-right pr-2 text-xs"
                  style={{
                    top: `${hour * CELL_HEIGHT}px`,
                    transform: "translateY(-50%)",
                  }}
                >
                  {hour !== 0 && format(new Date().setHours(hour, 0), "HH:mm")}
                </div>
              ))}
            </div>
          </div>

          {/* MAIN CANVAS */}
          <div className="flex flex-1 relative min-w-0">
            {/* GRID LINES */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="border-b border-slate-100 w-full"
                  style={{ height: `${CELL_HEIGHT}px` }}
                />
              ))}
            </div>

            {/* CURRENT TIME INDICATOR */}
            {showCurrentTimeLine && (
              <div
                className="absolute z-30 w-full pointer-events-none flex items-center"
                style={{ top: `${currentTimeTop}px` }}
              >
                <div className="absolute -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
                <div className="w-full border-t border-red-500" />
                <div className="absolute -left-12  bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                  {format(currentTime, "HH:mm")}
                </div>
              </div>
            )}

            {/* COLUMNS */}
            <div
              className="flex flex-1 divide-x divide-slate-200 relative z-10"
              style={{ height: `${GRID_TOTAL_HEIGHT}px` }}
            >
              {technicians?.map((tech) => {
                const techEvents = events.filter(
                  (e) =>
                    e.technician_id === tech.id &&
                    isSameDay(e.time, currentDate)
                );

                // Is this column currently being hovered over?
                const isHoverTarget = dropIndicator?.techId === tech.id;

                return (
                  <div
                    key={tech.id}
                    className={`flex-1 relative min-w-37.5 transition-colors duration-200 ${
                      isHoverTarget ? "bg-blue-50/50" : ""
                    }`}
                    onDragOver={(e) => handleDragOver(e, tech.id)}
                    onDrop={(e) => handleDrop(e, tech.id)}
                  >
                    {/* --- GHOST BOX (THE PREVIEW) --- */}
                    {isHoverTarget && dropIndicator && (
                      <div
                        className="absolute inset-x-1 rounded border border-dashed border-blue-400 bg-blue-100/40 z-10 pointer-events-none flex items-center justify-center text-blue-600 text-xs font-bold"
                        style={{
                          top: `${getVerticalPosition(dropIndicator.time)}px`,
                          height: `${
                            (dropIndicator.duration / 60) * CELL_HEIGHT
                          }px`,
                        }}
                      >
                        {format(dropIndicator.time, "HH:mm")}
                      </div>
                    )}

                    {/* --- EVENTS --- */}
                    {techEvents.map((event) => {
                      const top = getVerticalPosition(event.time);
                      const bottom = getVerticalPosition(event.end);
                      const height = Math.max(bottom - top, 24); // Minimum height

                      // If we are currently dragging THIS event, dim it
                      const isDraggingThis = dragRef.current?.id === event.id;

                      return (
                        <Popover key={event.id}>
                          <PopoverTrigger asChild>
                            <div
                              draggable="true"
                              onDragStart={(e) =>
                                handleDragStart(
                                  e,
                                  event.id,
                                  event.time,
                                  event.end
                                )
                              }
                              onDragEnd={handleDragEnd}
                              className={`
                                absolute inset-x-1 flex flex-col rounded border-l-4 border-blue-500 bg-[#EBF5FF] p-1.5 text-xs 
                                cursor-grab active:cursor-grabbing overflow-hidden z-20 
                                transition-all hover:brightness-95
                                ${
                                  isDraggingThis
                                    ? "opacity-40 grayscale"
                                    : "opacity-100"
                                }
                              `}
                              style={{ top: `${top}px`, height: `${height}px` }}
                            >
                              <div className="font-bold text-blue-900 truncate">
                                {
                                  customers?.find(
                                    (c) => c.id === event.customer_id
                                  )?.first_name
                                }{" "}
                                {
                                  customers?.find(
                                    (c) => c.id === event.customer_id
                                  )?.last_name
                                }
                              </div>
                              <div className="text-blue-700/80 mt-0.5 truncate text-[10px] font-medium">
                                {format(event.time, "HH:mm")} -{" "}
                                {format(event.end, "HH:mm")}
                              </div>
                              <div className="mt-0.5 truncate text-black/60">
                                {event.appointment_services?.map((s) => (
                                  <div key={s.services?.id}>
                                    {s.services?.service}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </PopoverTrigger>
                          <PopoverContent
                            side="right"
                            className="w-85 flex p-0 flex-col shadow-none"
                            align="start"
                          >
                            <div className="border-b py-2.5 px-5">
                              <div className="grid grid-cols-4">
                                <Label htmlFor="customer">Customer</Label>
                                <ComboboxInputCalendar
                                  placeholder="customers"
                                  defaultValue={event.customer_id}
                                  list={customers || []}
                                  // onSelect={(id) => {
                                  //   if (!id) return;

                                  //   mutate({
                                  //     id: event.id,
                                  //     updates: { customer_id: id },
                                  //   });
                                  // }}
                                />
                              </div>

                              <div className="grid grid-cols-4">
                                <Label htmlFor="time">Time</Label>
                                <div className="relative gap-2 pl-3 col-span-3 flex items-center">
                                  <ClockIcon />
                                  <Input
                                    type="time"
                                    id="time-picker"
                                    onBlur={(e) => {
                                      const newTimeString = e.target.value; // e.g., "14:30"
                                      if (!newTimeString) return;

                                      // Create a NEW Date object based on the current event date
                                      const newDate = new Date(event.time);

                                      // Extract hours and minutes from the picker input
                                      const [hours, minutes] = newTimeString
                                        .split(":")
                                        .map(Number);

                                      // Set them on the date object
                                      newDate.setHours(hours);
                                      newDate.setMinutes(minutes);

                                      // 3. Trigger the mutation
                                      mutate({
                                        id: event.id,
                                        updates: {
                                          time: newDate.toISOString(),
                                        },
                                      });
                                    }}
                                    step="1"
                                    defaultValue={format(event.time, "HH:mm")}
                                    className="text-xs border-none p-0 shadow-none appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-4">
                                <Label>Date</Label>
                                <Popover>
                                  <PopoverTrigger asChild className="col-end-3">
                                    <Button
                                      variant="outline"
                                      id="date"
                                      className="w-fit border-none text-xs font-medium shadow-none justify-between text-black"
                                    >
                                      <span className="flex gap-2 items-center">
                                        <CalendarDotIcon />
                                        {event.time
                                          ? format(event.time, "MM/dd/yyyy")
                                          : "Pick a date"}
                                      </span>
                                      <ChevronDownIcon />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-auto overflow-hidden p-0"
                                    align="start"
                                  >
                                    <Calendar
                                      selected={event.time}
                                      onSelect={(newDate) => {
                                        if (!newDate) return;

                                        // 2. Get the time from the CURRENT event
                                        const originalHours = getHours(
                                          event.time
                                        );
                                        const originalMinutes = getMinutes(
                                          event.time
                                        );

                                        // 3. Set that time onto the NEW date
                                        const dateWithOriginalTime = setMinutes(
                                          setHours(newDate, originalHours),
                                          originalMinutes
                                        );

                                        // 4. Save
                                        mutate({
                                          id: event.id,
                                          updates: {
                                            time: dateWithOriginalTime.toISOString(),
                                          },
                                        });
                                      }}
                                      mode="single"
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>

                              <div className="grid grid-cols-4">
                                <Label>Technician</Label>
                                <ComboboxInputCalendar
                                  placeholder="technician"
                                  defaultValue={event.technician_id}
                                  list={technicians}
                                  onSelect={(id) => {
                                    if (!id) return;

                                    mutate({
                                      id: event.id,
                                      updates: { technician_id: id },
                                    });
                                  }}
                                />
                              </div>

                              <div className="grid grid-cols-4">
                                <Label>Services</Label>
                                <ComboboxMultiple
                                  defaultValues={
                                    event.appointment_services?.map(
                                      (s) => s.services.id
                                    ) || []
                                  }
                                  onChange={(newServiceIds) => {
                                    syncServices.mutate({
                                      id: event.id,
                                      serviceIds: newServiceIds,
                                    });
                                  }}
                                />
                              </div>
                            </div>

                            <div className="py-4 px-5 text-xs flex flex-col gap-4 font-medium">
                              <div className="grid grid-cols-3">
                                <Label>Services Total</Label>
                                <p className="col-span-2">$90</p>
                              </div>

                              <div className="grid grid-cols-3">
                                <Label>Tips</Label>
                                <p className="col-span-2">$10</p>
                              </div>

                              <div className="grid grid-cols-3">
                                <Label>Total</Label>
                                <p className="col-span-2">$100</p>
                              </div>

                              <Button size={"sm"}>Finish Session</Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
