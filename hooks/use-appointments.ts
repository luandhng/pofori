"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAppointment } from "@/actions/server/fetch-data";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBusiness } from "./use-business";

export function useAppointments() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const { data: business } = useBusiness();
  const businessId = business?.id;

  const query = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => fetchAppointment(businessId),
    staleTime: Infinity,
    enabled: !!businessId,
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
          filter: `business_id=eq.${businessId}`,
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
  }, [supabase, queryClient, businessId]);

  return query;
}
