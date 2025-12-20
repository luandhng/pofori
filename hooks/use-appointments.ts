// hooks/use-customers.ts
import { useQuery } from "@tanstack/react-query";
import { fetchAppointment } from "@/actions/server/fetch-data";

export function useAppointments() {
  return useQuery({
    queryKey: ["appointments"],
    queryFn: async () => fetchAppointment(),
    staleTime: 1000 * 60 * 5,
  });
}
