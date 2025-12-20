// hooks/use-appointments.ts
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAppointment } from "@/actions/server/fetch-data";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useAppointments() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // 1. Fetch Data (Server Action)
  const query = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => fetchAppointment(),
    staleTime: Infinity,
  });

  // 2. Realtime Listener
  useEffect(() => {
    const channel = supabase
      .channel("appointments-realtime")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen for INSERT, UPDATE, DELETE
          schema: "public",
          table: "appointments",
        },
        (payload) => {
          console.log("⚡️ Appointment change detected:", payload);
          // Refetch data immediately
          queryClient.invalidateQueries({ queryKey: ["appointments"] });
        }
      )
      .subscribe();

    // Cleanup connection when component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient]);

  return query;
}
