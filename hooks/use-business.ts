import { fetchBusiness } from "@/actions/server/fetch-data";
import { useQuery } from "@tanstack/react-query";

export function useBusiness() {
  return useQuery({
    queryKey: ["business"],
    queryFn: async () => fetchBusiness(),
    staleTime: 1000 * 60 * 5,
  });
}
