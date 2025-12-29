import { updateAppointment } from "@/actions/server/update-data";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      await updateAppointment({ id, data: updates });
    },

    // 1. RUNS IMMEDIATELY (Before Server)
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["appointments"] });

      // Snapshot the previous value (so we can rollback if it fails)
      const previousAppointments = queryClient.getQueryData(["appointments"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["appointments"], (old: any[] | undefined) => {
        return old?.map((appt) => {
          if (appt.id === id) {
            // Merge the existing appointment with the new updates (e.g., new start_time)
            return { ...appt, ...updates };
          }
          return appt;
        });
      });

      // Return context with the snapshot
      return { previousAppointments };
    },

    // 2. RUNS IF ERROR
    onError: (err, newTodo, context: any) => {
      // Rollback to the previous value
      if (context?.previousAppointments) {
        queryClient.setQueryData(
          ["appointments"],
          context.previousAppointments
        );
      }
      console.error("Failed to update appointment:", err);
    },

    // 3. RUNS ALWAYS (Success or Error)
    onSettled: () => {
      // Always refetch after error or success to ensure data is truly in sync
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
};
