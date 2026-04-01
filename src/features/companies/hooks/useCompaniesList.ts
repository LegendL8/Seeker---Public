"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCompaniesList } from "../api";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export function useCompaniesList(
  page: number = DEFAULT_PAGE,
  limit: number = DEFAULT_LIMIT,
  q?: string,
) {
  return useQuery({
    queryKey: ["companies", "list", page, limit, q ?? ""],
    queryFn: () => fetchCompaniesList(page, limit, q),
  });
}
