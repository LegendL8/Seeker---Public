"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { updateCompany } from "../api";
import type { UpdateCompanyInput } from "../api";

export function useUpdateCompany(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (body: UpdateCompanyInput) => updateCompany(id, body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["companies", "list"] });
      queryClient.setQueryData(["companies", "detail", data.id], data);
      router.push(`/companies/${data.id}`);
    },
  });
}
