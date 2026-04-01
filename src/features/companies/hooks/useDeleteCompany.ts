"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { deleteCompany } from "../api";

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) => deleteCompany(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.removeQueries({ queryKey: ["companies", "detail", id] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      router.push("/companies");
    },
  });
}
