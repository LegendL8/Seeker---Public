import { getApiBaseUrl } from '@/lib/api';
import type {
  CreateNoteInput,
  ListNotesQuery,
  ListNotesResponse,
  Note,
  UpdateNoteInput,
} from './types';

function buildQueryString(query: ListNotesQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set('page', String(query.page));
  if (query.limit != null) params.set('limit', String(query.limit));
  if (query.typeTag) params.set('typeTag', query.typeTag);
  if (query.applicationId) params.set('applicationId', query.applicationId);
  if (query.interviewId) params.set('interviewId', query.interviewId);
  if (query.companyId) params.set('companyId', query.companyId);
  const s = params.toString();
  return s ? `?${s}` : '';
}

export async function fetchNotesList(
  query: ListNotesQuery
): Promise<ListNotesResponse> {
  const base = getApiBaseUrl();
  const url = `${base}/v1/notes${buildQueryString(query)}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      typeof data?.message === 'string' ? data.message : res.statusText;
    throw new Error(message);
  }
  return res.json() as Promise<ListNotesResponse>;
}

export async function fetchNoteById(id: string): Promise<Note> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/notes/${encodeURIComponent(id)}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      typeof data?.message === 'string' ? data.message : res.statusText;
    throw new Error(message);
  }
  return res.json() as Promise<Note>;
}

export async function createNote(body: CreateNoteInput): Promise<Note> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/notes`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      typeof data?.message === 'string' ? data.message : res.statusText;
    throw new Error(message);
  }
  return res.json() as Promise<Note>;
}

export async function updateNote(
  id: string,
  body: UpdateNoteInput
): Promise<Note> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/notes/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      typeof data?.message === 'string' ? data.message : res.statusText;
    throw new Error(message);
  }
  return res.json() as Promise<Note>;
}

export async function deleteNote(id: string): Promise<void> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/notes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      typeof data?.message === 'string' ? data.message : res.statusText;
    throw new Error(message);
  }
}
