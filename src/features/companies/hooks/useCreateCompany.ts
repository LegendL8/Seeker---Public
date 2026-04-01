"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createCompany } from "../api";
import type { CreateCompanyInput } from "../api";

export function useCreateCompany() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (body: CreateCompanyInput) => createCompany(body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["companies", "list"] });
      router.push(`/companies/${data.id}`);
    },
  });
}
