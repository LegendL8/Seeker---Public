"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApplicationsList } from "../api";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export function useApplicationsList(
  page: number = DEFAULT_PAGE,
  limit: number = DEFAULT_LIMIT,
) {
  return useQuery({
    queryKey: ["applications", "list", page, limit],
    queryFn: () => fetchApplicationsList(page, limit),
  });
}
