import { getRedisClient } from '../redis';
import type { DashboardMetrics } from './types';

const KEY_PREFIX = 'dashboard:metrics:';
const TTL_SECONDS = 60;

function cacheKey(userId: string): string {
  return `${KEY_PREFIX}${userId}`;
}

export async function getCachedMetrics(
  userId: string
): Promise<DashboardMetrics | null> {
  const client = getRedisClient();
  const raw = await client.get(cacheKey(userId));
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as DashboardMetrics;
  } catch {
    return null;
  }
}

export async function setCachedMetrics(
  userId: string,
  metrics: DashboardMetrics
): Promise<void> {
  const client = getRedisClient();
  await client.setEx(
    cacheKey(userId),
    TTL_SECONDS,
    JSON.stringify(metrics)
  );
}

export async function invalidateDashboardCache(userId: string): Promise<void> {
  const client = getRedisClient();
  await client.del(cacheKey(userId));
}
