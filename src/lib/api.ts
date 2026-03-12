/**
 * Base URL for API requests. Client-side fetches use same-origin proxy (/api/proxy).
 * Set NEXT_PUBLIC_API_URL to call Express directly (e.g. dev with CORS).
 */
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? '/api/proxy';
}
