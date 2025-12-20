import { fetchTechnicians } from "@/actions/server/fetch-data";
import { useQuery } from "@tanstack/react-query";

export function useTechnicians(businessId: string) {
  return useQuery({
    queryKey: ["technicians"],
    queryFn: async () => fetchTechnicians(businessId),
    staleTime: 1000 * 60 * 5,
    enabled: !!businessId,
  });
}
