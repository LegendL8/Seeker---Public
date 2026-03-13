"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { deleteApplication } from "../api";

export function useDeleteApplication(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => deleteApplication(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["applications", id] });
      queryClient.invalidateQueries({ queryKey: ["applications", "list"] });
      router.push("/applications");
    },
  });
}
