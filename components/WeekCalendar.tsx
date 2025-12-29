"use client";

import { useState, useEffect } from "react";
import {
  format,
  addDays,
  subDays,
  isSameDay,
  isToday,
  getHours,
  getMinutes,
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

// --- CONFIG ---
const CELL_HEIGHT = 60;
const HOURS_IN_DAY = 24;
const GRID_TOTAL_HEIGHT = HOURS_IN_DAY * CELL_HEIGHT;

// --- TYPES ---
export type CalendarEvent = {
  id: string;
  technician_id: string;
  time: Date; // Start time
  end: Date; // <--- ADD THIS (End time)
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
  const { data: technicians, isLoading: isLoadingTechs } = useTechnicians();
  const { data: customers } = useCustomers();
  const { data: services } = useServices();

  const { mutate } = useUpdateAppointment();
  const syncServices = useSyncServices(services || []); // Pass to hook

  useEffect(() => {
    setCurrentTime(new Date());
    const timerId = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timerId);
  }, []);

  const nextDay = () => setCurrentDate(addDays(currentDate, 1));
  const prevDay = () => setCurrentDate(subDays(currentDate, 1));
  const jumpToToday = () => setCurrentDate(new Date());

  const hours = Array.from({ length: HOURS_IN_DAY }, (_, i) => i);

  // Helper: Get pixel position from top (00:00)
  const getVerticalPosition = (date: Date) => {
    const h = getHours(date);
    const m = getMinutes(date);
    const totalMinutes = h * 60 + m;
    const pxPerMinute = CELL_HEIGHT / 60;
    return totalMinutes * pxPerMinute;
  };

  const currentTimeTop = getVerticalPosition(currentTime);
  const showCurrentTimeLine = isToday(currentDate);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 bg-white z-30 relative">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {format(currentDate, "d MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={jumpToToday}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-1 border rounded-md transition-colors"
          >
            Today
          </button>
          <div className="flex items-center border rounded-md ml-2">
            <button
              onClick={prevDay}
              className="p-1.5  border-r text-slate-500 hover:text-slate-700"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextDay}
              className="p-1.5  text-slate-500 hover:text-slate-700"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* TECH HEADER */}
      <div className="flex border-b border-slate-200 sticky top-0 z-20">
        {/* <div className="w-20 min-w-20 border-r border-slate-200" /> */}

        <div className="w-20 min-w-20 border-slate-200" />

        <div className="flex flex-1 ">
          {isLoadingTechs && (
            <div className="flex-1 pb-2 text-center text-sm text-slate-400 italic">
              Loading staff...
            </div>
          )}
          {technicians?.map((tech) => (
            <div
              key={tech.id}
              className="flex-1 pb-2 text-center min-w-[150px]"
            >
              <span className="text-sm truncate px-2 block">
                {tech.first_name.charAt(0).toUpperCase() +
                  tech.first_name.slice(1)}{" "}
                {tech.last_name.charAt(0).toUpperCase() +
                  tech.last_name.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* GRID */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar bg-white">
        <div className="flex min-w-full relative">
          {/* TIME AXIS */}
          <div className="w-20 min-w-20 bg-white border-r border-slate-200 select-none sticky left-0 z-30 h-max ">
            <div
              className="relative"
              style={{ height: `${GRID_TOTAL_HEIGHT}px` }}
            >
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute w-full text-black/50 text-right pr-2 text-xs"
                  style={{
                    top: `${hour * CELL_HEIGHT}px`,
                    transform: "translateY(-50%)",
                  }}
                >
                  {hour === 0
                    ? ""
                    : format(new Date().setHours(hour, 0), "HH:mm")}{" "}
                </div>
              ))}
            </div>
          </div>

          {/* MAIN BODY */}
          <div className="flex flex-1 relative min-w-0">
            <div className="absolute inset-0 z-0 pointer-events-none">
              {hours.map((hour) => (
                <div
                  key={`line-${hour}`}
                  className="border-b border-slate-100 w-full"
                  style={{ height: `${CELL_HEIGHT}px` }}
                />
              ))}
            </div>

            {showCurrentTimeLine && (
              <div
                className="absolute z-30 w-full pointer-events-none flex items-center"
                style={{ top: `${currentTimeTop}px` }}
              >
                <div className="absolute -left-[5px] w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                <div className="w-full border-t border-red-500"></div>
                <div className="absolute -left-12  bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                  {format(currentTime, "HH:mm")}
                </div>
              </div>
            )}

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

                return (
                  <div
                    key={tech.id}
                    className="flex-1 relative min-w-[150px] group"
                  >
                    <div className="absolute inset-0 opacity-0 transition-opacity pointer-events-none"></div>

                    {techEvents.map((event) => {
                      // --- FIX: CALCULATE HEIGHT CORRECTLY ---
                      const top = getVerticalPosition(event.time);
                      const bottom = getVerticalPosition(event.end); // Use event.end
                      const height = bottom - top;

                      const finalHeight = Math.max(height, 24);

                      return (
                        <Popover key={event.id}>
                          <PopoverTrigger
                            className="absolute inset-x-1 flex text-left flex-col rounded border-l-4 border-blue-500 bg-[#EBF5FF] p-1.5 text-xs cursor-pointer overflow-hidden z-20"
                            style={{
                              top: `${top}px`,
                              height: `${finalHeight}px`,
                            }}
                          >
                            <div className="font-bold  text-blue-800 leading-tight truncate">
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
                            <div className="text-blue-600 mt-0.5 text-xs truncate opacity-90">
                              {/* --- FIX: SHOW CORRECT TIME RANGE --- */}
                              {format(event.time, "HH:mm")} -{" "}
                              {format(event.end, "HH:mm")}
                            </div>
                            <div>
                              {event.appointment_services?.map((service) => (
                                <div key={service.services?.id}>
                                  {service.services?.service}
                                </div>
                              ))}
                            </div>
                          </PopoverTrigger>
                          <PopoverContent
                            side="right"
                            className="w-80 p-0 shadow-xl flex flex-col divide-y divide-slate-200"
                          >
                            <div className="flex gap-2 p-2">
                              <Input placeholder="First name" />
                              <Input placeholder="Last name" />
                            </div>

                            <div className="flex gap-2 p-2">
                              <div className="relative">
                                <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50">
                                  <Clock8Icon className="size-4" />
                                  <span className="sr-only">User</span>
                                </div>
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
                                      updates: { time: newDate.toISOString() },
                                    });
                                  }}
                                  step="1"
                                  defaultValue={format(event.time, "HH:mm")}
                                  className="peer bg-background appearance-none pl-9 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                />
                              </div>

                              <Popover>
                                <PopoverTrigger asChild className="">
                                  <Button
                                    variant="outline"
                                    id="date"
                                    className=" justify-between font-normal"
                                  >
                                    <span className="flex items-center">
                                      <CalendarIcon className="mr-2" />
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
                                    mode="single"
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>

                            <div className="flex gap-2 p-2">
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

                            <div className="flex gap-2 p-2">
                              <ComboboxMultiple
                                defaultValues={
                                  event.appointment_services?.map(
                                    (s) => s.services.id
                                  ) || []
                                }
                                onChange={(newServiceIds) => {
                                  syncServices.mutate({
                                    id: event.id,
                                    serviceIds: newServiceIds, // Pass the full new array of IDs
                                  });
                                }}
                              />
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
