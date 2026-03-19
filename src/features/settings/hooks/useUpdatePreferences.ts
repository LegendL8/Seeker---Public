"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePreferences } from "../api";
import type { PostingCheckFrequency } from "../types";

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postingCheckFrequency: PostingCheckFrequency) =>
      updatePreferences(postingCheckFrequency),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "preferences"] });
    },
  });
}
