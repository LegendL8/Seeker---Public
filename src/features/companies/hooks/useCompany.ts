"use client";

import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { fetchCompanyById } from "../api";

export function useCompany(id: string | null) {
  return useQuery({
    queryKey: ["companies", "detail", id],
    queryFn: () => fetchCompanyById(id as string),
    enabled: typeof id === "string" && id.length > 0,
  });
}

export function useCompanyNamesByIds(ids: string[]) {
  const uniqueIds = useMemo(() => Array.from(new Set(ids)), [ids]);
  const queries = useQueries({
    queries: uniqueIds.map((id) => ({
      queryKey: ["companies", "detail", id] as const,
      queryFn: () => fetchCompanyById(id),
      enabled: id.length > 0,
    })),
  });

  return useMemo(() => {
    const names = new Map<string, string>();
    for (let idx = 0; idx < uniqueIds.length; idx += 1) {
      const id = uniqueIds[idx];
      const data = queries[idx]?.data;
      if (data) {
        names.set(id, data.name);
      }
    }
    return names;
  }, [queries, uniqueIds]);
}
