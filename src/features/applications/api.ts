import { getApiBaseUrl } from "@/lib/api";
import type { Application, ListApplicationsResponse } from "./types";

export async function fetchApplicationsList(
  page: number,
  limit: number,
): Promise<ListApplicationsResponse> {
  const base = getApiBaseUrl();
  const url = `${base}/v1/applications?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body?.message === "string" ? body.message : res.statusText;
    throw new Error(message);
  }
  return res.json() as Promise<ListApplicationsResponse>;
}

export interface CreateApplicationInput {
  jobTitle: string;
  status?: string;
  companyId?: string;
  jobPostingUrl?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryPeriod?: "yearly" | "hourly";
  appliedAt?: string;
  source?: string;
  resumeId?: string;
}

export async function createApplication(
  body: CreateApplicationInput,
): Promise<Application> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/applications`, {
    method: "POST",
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
  return res.json() as Promise<Application>;
}

export async function fetchApplicationById(id: string): Promise<Application> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/applications/${encodeURIComponent(id)}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      typeof data?.message === "string" ? data.message : res.statusText;
    throw new Error(message);
  }
  return res.json() as Promise<Application>;
}

export interface UpdateApplicationInput {
  jobTitle?: string;
  status?: string;
  companyId?: string | null;
  jobPostingUrl?: string | null;
  location?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryPeriod?: "yearly" | "hourly" | null;
  appliedAt?: string | null;
  source?: string | null;
  resumeId?: string | null;
}

export async function updateApplication(
  id: string,
  body: UpdateApplicationInput,
): Promise<Application> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/applications/${encodeURIComponent(id)}`, {
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
  return res.json() as Promise<Application>;
}

export async function deleteApplication(id: string): Promise<void> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/applications/${encodeURIComponent(id)}`, {
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

export interface ParsePostingResult {
  jobTitle: string | null;
  companyName: string | null;
  location: string | null;
  jobPostingUrl: string;
}

export async function parseJobPosting(
  url: string,
): Promise<ParsePostingResult> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/applications/parse-posting`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: url.trim() }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      typeof data?.message === "string" ? data.message : res.statusText;
    throw new Error(message);
  }
  return res.json() as Promise<ParsePostingResult>;
}
