"use client";

import { useState } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  getHours,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils"; // Or standard clsx/tailwind-merge import
import { useCustomers } from "@/hooks/use-customers";
import { useTechnicians } from "@/hooks/use-technicians";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Input } from "./ui/input";
import { SidebarSimpleIcon } from "@phosphor-icons/react/dist/ssr";

// --- TYPES ---
export type Event = {
  id: string;
  customer_id: string;
  service_id: string;
  status: boolean;
  technician_id: string;
  time: Date;
  type?: "default" | "highlight"; // Add more types as needed
};

interface CalendarProps {
  events?: Event[];
}

export function MainCalendar({ events = [] }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: customers } = useCustomers();
  const { data: technicians } = useTechnicians();

  // --- CALENDAR LOGIC ---

  const monthStart = startOfMonth(currentDate);

  // 1. Always start on the Sunday/Monday before the 1st of the month
  const startDate = startOfWeek(monthStart);

  // 2. Generate exactly 42 days (6 weeks * 7 days)
  // We use a simple loop or map to create the array
  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    // startDate + i days
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    return day;
  });

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // --- NAVIGATION ---
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const jumpToToday = () => setCurrentDate(new Date());

  return (
    <div className="flex flex-col h-full w-full bg-white text-neutral-800">
      {/* HEADER */}
      <div className="flex items-center justify-between py-2 px-4">
        <div className="flex items-center gap-4">
          <SidebarSimpleIcon size={16} />
          <h2 className="font-semibold">
            {format(currentDate, "dd MMM yyyy")}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-neutral-100 rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={jumpToToday}
            className="text-sm font-medium px-3 py-1 border rounded hover:bg-neutral-50"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-neutral-100 rounded-full"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* WEEKDAY HEADERS */}
      <div className="grid grid-cols-7 border-b text-xs">
        {weekDays.map((day) => (
          <div key={day} className="py-2 text-right pr-2 tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* DAYS GRID */}
      {/* We use flex-1 to make it fill the remaining height if needed */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1 auto-rows-fr">
        {calendarDays.map((day) => {
          // Check if this day has any events
          const dayEvents = events.filter((e) => isSameDay(e.time, day));
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isDayToday = isToday(day);

          return (
            <div
              key={day.toString()}
              className={cn(
                "p-1 border-b border-r hover:bg-neutral-50 flex flex-col gap-0",
                !isCurrentMonth && "bg-white text-black/30" // Gray out padding days
              )}
            >
              {/* DATE NUMBER HEADER */}
              <div className="flex justify-end">
                <span
                  className={cn(
                    "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-sm",
                    isDayToday
                      ? "bg-red-500 text-white" // Red circle for Today
                      : ""
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>

              {/* EVENTS LIST */}
              <div className="flex flex-col gap-1 mt-1">
                {dayEvents.map((event) => {
                  const customerName =
                    customers?.find((c) => c.id === event.customer_id)
                      ?.first_name +
                    " " +
                    customers?.find((c) => c.id === event.customer_id)
                      ?.last_name;

                  const technicianName =
                    technicians?.find((t) => t.id === event.technician_id)
                      ?.first_name +
                    " " +
                    technicians?.find((t) => t.id === event.technician_id)
                      ?.last_name;

                  return (
                    <Popover key={event.id}>
                      <PopoverTrigger
                        className={`text-xs px-1.5 cursor-pointer flex items-center justify-between text-white py-0.5 rounded truncate font-medium`}
                        style={{
                          backgroundColor:
                            technicians?.find(
                              (t) => t.id === event.technician_id
                            )?.color || "gray", // Fallback color
                        }}
                      >
                        <p>{customerName}</p>

                        <p>{format(event.time, "hh:mm a")}</p>
                      </PopoverTrigger>
                      <PopoverContent className="flex bg-white/50 backdrop-blur-xl xp-3 flex-col gap-3 rounded-2xl">
                        <Input
                          onChange={() => {}}
                          placeholder="Customer"
                          value={customerName}
                        />
                        <Input
                          onChange={() => {}}
                          placeholder="Technician"
                          value={technicianName}
                        />
                        <div className="flex gap-2">
                          <Input type="time" />
                          <Input type="time" />
                        </div>
                        <Input type="date" />
                      </PopoverContent>
                    </Popover>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
