"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApplicationById } from "../api";

export function useApplication(id: string | null) {
  return useQuery({
    queryKey: ["applications", id],
    queryFn: () => fetchApplicationById(id as string),
    enabled: typeof id === "string" && id.length > 0,
  });
}
