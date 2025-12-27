// hooks/use-update-schedule.ts
import { updateBusinessHours } from "@/actions/server/update-data";
import { useQueryClient, useMutation } from "@tanstack/react-query";

export const useUpdateBusiness = (businessId: string) => {
  const queryClient = useQueryClient();
  const queryKey = ["business"];

  return useMutation({
    mutationFn: async (newOperatingHours: any) => {
      updateBusinessHours({ id: businessId, newHours: newOperatingHours });
    },

    onMutate: async (newOperatingHours) => {
      await queryClient.cancelQueries({ queryKey });

      const previousBusiness = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          operating_hours: newOperatingHours,
        };
      });

      return { previousBusiness };
    },

    onError: (err, newOperatingHours, context) => {
      if (context?.previousBusiness) {
        queryClient.setQueryData(queryKey, context.previousBusiness);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};
