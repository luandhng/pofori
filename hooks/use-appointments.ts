"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAppointment } from "@/actions/server/fetch-data";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useAppointments() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const query = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => fetchAppointment(),
    staleTime: Infinity,
  });

  useEffect(() => {
    const channel = supabase
      .channel("appointments-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
        },
        (payload) => {
          console.log("⚡️ Appointment change detected:", payload);
          queryClient.invalidateQueries({ queryKey: ["appointments"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient]);

  return query;
}
