"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateDisplayName } from "../api";

export function useUpdateDisplayName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (displayName: string | null) => updateDisplayName(displayName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "user"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}
