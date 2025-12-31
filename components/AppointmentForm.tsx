"use client";

import { useState } from "react";
import { format, getHours, getMinutes } from "date-fns";
import { CalendarDotIcon, ClockIcon } from "@phosphor-icons/react/dist/ssr";

// UI Imports
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { ComboboxInputCalendar } from "./ComboboxInputCalendar";
import ComboboxMultiple from "./ComboboxMultiple";

// Hooks
import { useUpdateAppointment } from "@/hooks/use-update-appointment";
import { useServices } from "@/hooks/use-services";
import { useSyncServices } from "@/hooks/use-insert-appointment-services";
import { CalendarEvent } from "@/app/types";

interface AppointmentFormProps {
  event: CalendarEvent;
  customers: any[]; // Replace with your actual Customer type
  technicians: any[]; // Replace with your actual Technician type
}

export default function AppointmentForm({
  event,
  customers,
  technicians,
}: AppointmentFormProps) {
  const { mutate } = useUpdateAppointment();
  const { data: services } = useServices();
  const syncServices = useSyncServices(services || []);

  // --- STATE ---
  const [tipPercentage, setTipPercentage] = useState<number>(event.tip || 0);
  const [paymentMethod, setPaymentMethod] = useState<string>(
    event.payment || ""
  );

  // --- CALCULATIONS ---
  const servicesTotal =
    event.appointment_services?.reduce(
      (sum: number, item: any) => sum + (item.services?.price || 0),
      0
    ) || 0;

  const tipAmount = servicesTotal * (tipPercentage / 100);
  const grandTotal = servicesTotal + tipAmount;

  return (
    <>
      {/* TOP FORM SECTION */}
      <div className="border-b pt-3 pb-4 px-4 flex flex-col gap-3">
        {/* Customer */}
        <div className="flex items-center">
          <Label htmlFor="customer" className="w-20">
            Customer
          </Label>
          <ComboboxInputCalendar
            placeholder="customers"
            defaultValue={event.customer_id}
            list={customers}
            onSelect={(id) =>
              id && mutate({ id: event.id, updates: { customer_id: id } })
            }
          />
        </div>

        {/* Time Picker */}
        <div className="flex items-center">
          <Label htmlFor="time" className="w-20">
            Time
          </Label>
          <div className="relative gap-1.5 py-1 px-2 flex items-center">
            <ClockIcon weight="fill" size={15} />
            <input
              type="time"
              defaultValue={format(event.time, "HH:mm")}
              onBlur={(e) => {
                const [h, m] = e.target.value.split(":").map(Number);
                const newDate = new Date(event.time);
                newDate.setHours(h);
                newDate.setMinutes(m);
                mutate({
                  id: event.id,
                  updates: { time: newDate.toISOString() },
                });
              }}
              className="text-xs border-none shadow-none appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
            />
          </div>
        </div>

        {/* Date Picker */}
        <div className="flex items-center">
          <Label className="w-20">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-xs px-2 py-1 flex items-center gap-2 text-black">
                <CalendarDotIcon weight="fill" size={15} />
                <p>{format(event.time, "MM/dd/yyyy")}</p>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                selected={event.time}
                mode="single"
                onSelect={(newDate) => {
                  if (!newDate) return;
                  const d = new Date(newDate);
                  d.setHours(getHours(event.time));
                  d.setMinutes(getMinutes(event.time));
                  mutate({ id: event.id, updates: { time: d.toISOString() } });
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Technician */}
        <div className="flex items-center">
          <Label className="w-20">Technician</Label>
          <ComboboxInputCalendar
            placeholder="technician"
            defaultValue={event.technician_id}
            list={technicians}
            onSelect={(id) =>
              id && mutate({ id: event.id, updates: { technician_id: id } })
            }
          />
        </div>

        {/* Services */}
        <div className="flex items-center">
          <Label className="w-20">Services</Label>
          <ComboboxMultiple
            defaultValues={
              event.appointment_services?.map((s: any) => s.services.id) || []
            }
            onChange={(ids) =>
              syncServices.mutate({ id: event.id, serviceIds: ids })
            }
          />
        </div>
      </div>

      {/* BOTTOM TOTALS SECTION */}
      <div className="pt-2 pb-4 px-4 text-xs flex flex-col gap-4 font-medium">
        <div className="flex items-center">
          <Label className="w-20">Total</Label>
          <p className="px-2">${servicesTotal.toFixed(2)}</p>
        </div>

        {/* Tip Selector */}
        <div className="flex items-center">
          <Label className="w-20">Tip</Label>
          <div className="flex gap-1 px-2">
            {[10, 15, 18, 20].map((pct) => (
              <Badge
                key={pct}
                variant={tipPercentage === pct ? "default" : "outline"}
                className="rounded-sm cursor-pointer"
                onClick={() =>
                  setTipPercentage(pct === tipPercentage ? 0 : pct)
                }
              >
                {pct}%
              </Badge>
            ))}
          </div>
        </div>

        {/* Grand Total */}
        <div className="flex items-center">
          <Label className="w-20">Total</Label>
          <div className="px-2">${grandTotal.toFixed(2)}</div>
        </div>

        {/* Payment Method */}
        <div className="flex items-center">
          <Label className="w-20">Payment</Label>
          <div className="flex gap-1 px-2">
            {["Cash", "Card", "Check", "Other"].map((method) => (
              <Badge
                onClick={() => setPaymentMethod(method.toLowerCase())}
                key={method}
                variant={
                  paymentMethod === method.toLowerCase() ? "default" : "outline"
                }
                className="rounded-sm cursor-pointer"
              >
                {method}
              </Badge>
            ))}
          </div>
        </div>

        <Button
          onClick={() => {
            mutate({
              id: event.id,
              updates: {
                status: "completed",
                tip: tipPercentage,
                payment: paymentMethod,
                total: grandTotal,
              },
            });
          }}
          size="sm"
          disabled={event.status === "completed"}
          className={event.status === "completed" ? "bg-green-500" : ""}
        >
          {event.status === "completed" ? "Completed" : "Finish Session"}
        </Button>
      </div>
    </>
  );
}
