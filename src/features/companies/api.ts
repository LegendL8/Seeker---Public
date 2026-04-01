import { getApiBaseUrl } from "@/lib/api";
import type { Company, ListCompaniesResponse } from "./types";

export async function fetchCompaniesList(
  page: number,
  limit: number,
  q?: string,
): Promise<ListCompaniesResponse> {
  const base = getApiBaseUrl();
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const trimmed = q?.trim();
  if (trimmed) {
    params.set("q", trimmed);
  }
  const url = `${base}/v1/companies?${params.toString()}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body?.message === "string" ? body.message : res.statusText;
    throw new Error(message);
  }
  return res.json() as Promise<ListCompaniesResponse>;
}

export async function fetchCompanyById(id: string): Promise<Company> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/companies/${encodeURIComponent(id)}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      typeof data?.message === "string" ? data.message : res.statusText;
    throw new Error(message);
  }
  return res.json() as Promise<Company>;
}

export interface CreateCompanyInput {
  name: string;
  website?: string;
  industry?: string;
}

export async function createCompany(
  body: CreateCompanyInput,
): Promise<Company> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/companies`, {
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
  return res.json() as Promise<Company>;
}

export interface UpdateCompanyInput {
  name?: string;
  website?: string | null;
  industry?: string | null;
}

export async function updateCompany(
  id: string,
  body: UpdateCompanyInput,
): Promise<Company> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/companies/${encodeURIComponent(id)}`, {
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
  return res.json() as Promise<Company>;
}

export async function deleteCompany(id: string): Promise<void> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/companies/${encodeURIComponent(id)}`, {
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
