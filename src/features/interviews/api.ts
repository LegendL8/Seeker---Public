import { getApiBaseUrl } from "@/lib/api";
import type {
  CreateInterviewInput,
  Interview,
  ListInterviewsResponse,
  UpdateInterviewInput,
} from "./types";

export async function fetchInterviewsByApplicationId(
  applicationId: string,
): Promise<ListInterviewsResponse> {
  const base = getApiBaseUrl();
  const url = `${base}/v1/applications/${encodeURIComponent(applicationId)}/interviews`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      typeof data?.message === "string" ? data.message : res.statusText;
    throw new Error(message);
  }
  return res.json() as Promise<ListInterviewsResponse>;
}

export async function createInterview(
  applicationId: string,
  body: CreateInterviewInput,
): Promise<Interview> {
  const base = getApiBaseUrl();
  const res = await fetch(
    `${base}/v1/applications/${encodeURIComponent(applicationId)}/interviews`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      typeof data?.message === "string" ? data.message : res.statusText;
    throw new Error(message);
  }
  return res.json() as Promise<Interview>;
}

export async function fetchInterviewById(id: string): Promise<Interview> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/interviews/${encodeURIComponent(id)}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      typeof data?.message === "string" ? data.message : res.statusText;
    throw new Error(message);
  }
  return res.json() as Promise<Interview>;
}

export async function updateInterview(
  id: string,
  body: UpdateInterviewInput,
): Promise<Interview> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/interviews/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      typeof data?.message === "string" ? data.message : res.statusText;
    throw new Error(message);
  }
  return res.json() as Promise<Interview>;
}

export async function deleteInterview(id: string): Promise<void> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/interviews/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      typeof data?.message === "string" ? data.message : res.statusText;
    throw new Error(message);
  }
}
