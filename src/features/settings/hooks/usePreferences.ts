"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPreferences } from "../api";

export function usePreferences() {
  return useQuery({
    queryKey: ["settings", "preferences"],
    queryFn: () => fetchPreferences(),
  });
}
