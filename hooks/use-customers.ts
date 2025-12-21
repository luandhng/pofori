import { fetchCustomers } from "@/actions/server/fetch-data";
import { useQuery } from "@tanstack/react-query";
import { useBusiness } from "./use-business";

export function useCustomers() {
  const { data: business } = useBusiness();
  const businessId = business?.id;

  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => fetchCustomers(businessId),
    staleTime: 1000 * 60 * 5,
    enabled: !!businessId,
  });
}
