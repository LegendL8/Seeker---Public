import { getApiBaseUrl } from "@/lib/api";
import type {
  CurrentUser,
  PostingCheckFrequency,
  PreferencesResponse,
} from "./types";

function readErrorMessage(statusText: string, body: unknown): string {
  if (
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof (body as { message?: unknown }).message === "string"
  ) {
    return (body as { message: string }).message;
  }
  return statusText;
}

export async function fetchCurrentUserSettings(): Promise<CurrentUser> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/users/me`, { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(readErrorMessage(res.statusText, body));
  }
  return res.json() as Promise<CurrentUser>;
}

export async function updateDisplayName(
  displayName: string | null,
): Promise<CurrentUser> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/users/me`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(readErrorMessage(res.statusText, body));
  }
  return res.json() as Promise<CurrentUser>;
}

export async function deleteCurrentUserAccount(): Promise<void> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/users/me`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(readErrorMessage(res.statusText, body));
  }
}

export async function fetchPreferences(): Promise<PreferencesResponse> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/users/me/preferences`, {
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(readErrorMessage(res.statusText, body));
  }
  return res.json() as Promise<PreferencesResponse>;
}

export async function updatePreferences(
  postingCheckFrequency: PostingCheckFrequency,
): Promise<PreferencesResponse> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/users/me/preferences`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postingCheckFrequency }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(readErrorMessage(res.statusText, body));
  }
  return res.json() as Promise<PreferencesResponse>;
}
