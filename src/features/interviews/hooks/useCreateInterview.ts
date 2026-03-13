import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInterview } from "../api";
import type { CreateInterviewInput } from "../types";

export function useCreateInterview(applicationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateInterviewInput) =>
      createInterview(applicationId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["interviews", applicationId],
      });
    },
  });
}
