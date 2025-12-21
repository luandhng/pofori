import { fetchServices } from "@/actions/server/fetch-data";
import { useQuery } from "@tanstack/react-query";
import { useBusiness } from "./use-business";

export function useServices() {
  const { data: business } = useBusiness();
  const businessId = business?.id;

  return useQuery({
    queryKey: ["services"],
    queryFn: async () => fetchServices(businessId),
    staleTime: 1000 * 60 * 5,
    enabled: !!businessId,
  });
}
