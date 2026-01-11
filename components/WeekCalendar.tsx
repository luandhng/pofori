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
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

// --- IMPORTS ---
import { useTechnicians } from "@/hooks/use-technicians";
import { useCustomers } from "@/hooks/use-customers";
import { useUpdateAppointment } from "@/hooks/use-update-appointment";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";

// --- IMPORT THE NEW COMPONENT ---
import AppointmentForm from "./AppointmentForm";
import { CalendarEvent } from "@/app/types";

// --- CONFIG ---
const CELL_HEIGHT = 60;
const HOURS_IN_DAY = 24;
const GRID_TOTAL_HEIGHT = HOURS_IN_DAY * CELL_HEIGHT;
const SNAP_MINUTES = 15;

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

  // --- DRAG STATE ---
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
  const { mutate } = useUpdateAppointment();

  useEffect(() => {
    setCurrentTime(new Date());
    const timerId = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timerId);
  }, []);

  const nextDay = () => setCurrentDate(addDays(currentDate, 1));
  const prevDay = () => setCurrentDate(subDays(currentDate, 1));
  const jumpToToday = () => setCurrentDate(new Date());

  const hours = Array.from({ length: HOURS_IN_DAY }, (_, i) => i);

  // --- HELPERS ---
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
    const relativeY = clientY - columnTop;
    const adjustedY = relativeY - offsetY;
    const pixelsPerMinute = CELL_HEIGHT / 60;
    const rawMinutes = adjustedY / pixelsPerMinute;
    const snappedMinutes = Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES;
    const safeMinutes = Math.max(0, Math.min(snappedMinutes, 24 * 60));
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
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const duration = differenceInMinutes(endTime, startTime);
    dragRef.current = { id, offsetY, duration, originalTime: startTime };
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, techId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!dragRef.current) return;

    const columnRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const newTime = calculateSnappedTime(
      e.clientY,
      columnRect.top,
      dragRef.current.offsetY
    );

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
      updates: { technician_id: techId, time: newStartTime.toISOString() },
    });
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
      <div className="flex items-center justify-between p-4  bg-white z-30 relative">
        <h2 className="text-xl font-bold tracking-tight">
          {format(currentDate, "d MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={jumpToToday}>
            Today
          </Button>
          <div className="flex items-center border rounded-full">
            <button onClick={prevDay} className="p-1.5 border-r">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextDay} className="p-1.5">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* TECH HEADER */}
      <div className="flex border-b border-neutral-200 sticky top-0 z-20 bg-white">
        <div className="w-20 min-w-20 border-neutral-200" />
        <div className="flex flex-1">
          {isLoadingTechs && (
            <div className="flex-1 p-2 text-sm text-gray-400 italic">
              Loading...
            </div>
          )}
          {technicians?.map((tech) => (
            <div key={tech.id} className="flex-1 pb-3  text-center">
              {tech.first_name.charAt(0).toUpperCase() +
                tech.first_name.slice(1).toLowerCase()}{" "}
              {tech.last_name.charAt(0).toUpperCase() +
                tech.last_name.slice(1).toLowerCase()}
            </div>
          ))}
        </div>
      </div>

      {/* GRID */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar bg-white">
        <div className="flex min-w-full relative">
          {/* TIME AXIS */}
          <div className="w-20 min-w-20 bg-white border-r border-neutral-200 sticky left-0 z-30">
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
            <div className="absolute inset-0 z-0 pointer-events-none">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="border-b border-neutral-200 w-full"
                  style={{ height: `${CELL_HEIGHT}px` }}
                />
              ))}
            </div>

            {showCurrentTimeLine && (
              <div
                className="absolute z-30 w-full pointer-events-none flex items-center"
                style={{ top: `${currentTimeTop}px` }}
              >
                <div className="absolute -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
                <div className="w-full border-t border-red-500" />
                <div className="absolute -left-12 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                  {format(currentTime, "HH:mm")}
                </div>
              </div>
            )}

            <div
              className="flex flex-1 divide-x divide-neutral-200 relative z-10"
              style={{ height: `${GRID_TOTAL_HEIGHT}px` }}
            >
              {technicians?.map((tech) => {
                const techEvents = events.filter(
                  (e) =>
                    e.technician_id === tech.id &&
                    isSameDay(e.time, currentDate)
                );
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

                    {techEvents.map((event) => {
                      const top = getVerticalPosition(event.time);
                      const bottom = getVerticalPosition(event.end);
                      const height = Math.max(bottom - top, 24);
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
                              className={`absolute inset-x-1 flex flex-col rounded border-l-4 border-blue-500 bg-[#EBF5FF] p-1.5 text-xs cursor-grab active:cursor-grabbing overflow-hidden z-20 transition-all hover:brightness-95 ${
                                isDraggingThis
                                  ? "opacity-40 grayscale"
                                  : "opacity-100"
                              }`}
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
                                {event.appointment_services?.map((s: any) => (
                                  <div key={s.services?.id}>
                                    {s.services?.service}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </PopoverTrigger>
                          <PopoverContent
                            side="right"
                            className="w-90 flex p-0 flex-col gap-2 shadow-none"
                            align="start"
                          >
                            {/* NEW: Using the import */}
                            <AppointmentForm
                              event={event}
                              customers={customers || []}
                              technicians={technicians || []}
                            />
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
