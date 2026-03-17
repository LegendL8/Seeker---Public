import { getApiBaseUrl } from "@/lib/api";
import type { CurrentUser } from "./types";

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const base = getApiBaseUrl();
  const url = `${base}/v1/me`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body?.message === "string" ? body.message : res.statusText;
    throw new Error(message);
  }
  return res.json() as Promise<CurrentUser>;
}
