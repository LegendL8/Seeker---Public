import { getApiBaseUrl } from "@/lib/api";
import type { ListResumesResponse, Resume, ResumeWithSignedUrl } from "./types";

export async function fetchResumesList(
  page: number,
  limit: number,
): Promise<ListResumesResponse> {
  const base = getApiBaseUrl();
  const url = `${base}/v1/resumes?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body?.message === "string" ? body.message : res.statusText;
    throw new Error(message);
  }
  return res.json() as Promise<ListResumesResponse>;
}

export async function uploadResume(file: File): Promise<Resume> {
  const base = getApiBaseUrl();
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${base}/v1/resumes`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      typeof data?.message === "string" ? data.message : res.statusText;
    throw new Error(message);
  }
  const json = await res.json();
  return json.data as Resume;
}

export async function fetchResumeWithUrl(
  id: string,
): Promise<ResumeWithSignedUrl> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/resumes/${encodeURIComponent(id)}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      typeof data?.message === "string" ? data.message : res.statusText;
    throw new Error(message);
  }
  const json = await res.json();
  return json.data as ResumeWithSignedUrl;
}

export async function setResumeActive(
  id: string,
  isActive: boolean,
): Promise<Resume> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/resumes/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      typeof data?.message === "string" ? data.message : res.statusText;
    throw new Error(message);
  }
  const json = await res.json();
  return json.data as Resume;
}

export async function deleteResume(id: string): Promise<void> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/resumes/${encodeURIComponent(id)}`, {
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
