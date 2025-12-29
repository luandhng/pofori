import { useMutation, useQueryClient } from "@tanstack/react-query";
import { syncAppointmentServices } from "@/actions/server/update-data";

export const useSyncServices = (allServices: any[]) => {
  // <--- Accept all services
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      serviceIds,
    }: {
      id: string;
      serviceIds: string[];
    }) => {
      await syncAppointmentServices({
        appointment_id: id,
        service_ids: serviceIds,
      });
    },
    // --- OPTIMISTIC UPDATE START ---
    onMutate: async ({ id, serviceIds }) => {
      // 1. Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["appointments"] });

      // 2. Snapshot the previous value
      const previousAppointments = queryClient.getQueryData(["appointments"]);

      // 3. Optimistically update to the new value
      queryClient.setQueryData(["appointments"], (old: any[]) => {
        return old?.map((appt) => {
          if (appt.id === id) {
            // Mock the structure Supabase returns
            // We need to find the Service NAMES based on the IDs passed
            const optimisticServices = serviceIds.map((sId) => {
              const serviceObj = allServices.find((s) => s.id === sId);
              return { services: serviceObj }; // Structure: { services: { service: "Name", ... } }
            });

            return {
              ...appt,
              appointment_services: optimisticServices,
            };
          }
          return appt;
        });
      });

      return { previousAppointments };
    },
    // If error, roll back
    onError: (err, newTodo, context: any) => {
      queryClient.setQueryData(["appointments"], context.previousAppointments);
    },
    // --- OPTIMISTIC UPDATE END ---

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
};
