import { getApiBaseUrl } from '@/lib/api';
import type { DashboardMetricsResponse } from './types';

export async function fetchDashboardMetrics(): Promise<DashboardMetricsResponse> {
  const base = getApiBaseUrl();
  const url = `${base}/v1/dashboard/metrics`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body?.message === 'string' ? body.message : res.statusText;
    throw new Error(message);
  }
  return res.json() as Promise<DashboardMetricsResponse>;
}
