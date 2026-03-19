"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUserSettings } from "../api";

export function useSettingsUser() {
  return useQuery({
    queryKey: ["settings", "user"],
    queryFn: () => fetchCurrentUserSettings(),
  });
}
