import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteInterview } from "../api";

export function useDeleteInterview(applicationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteInterview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["interviews", applicationId],
      });
    },
  });
}
