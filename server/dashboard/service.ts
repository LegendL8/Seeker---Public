import { count, eq } from 'drizzle-orm';

import { db } from '../db';
import { applications, interviews } from '../db/schema';
import { getCachedMetrics, setCachedMetrics } from './cache';
import type { ApplicationsByStatus, DashboardMetrics } from './types';

function defaultApplicationsByStatus(): ApplicationsByStatus {
  const out: ApplicationsByStatus = {
    saved: 0,
    applied: 0,
    interviewing: 0,
    offer: 0,
    rejected: 0,
  };
  return out;
}

function statusCountsToMap(
  rows: { status: string; count: number }[]
): ApplicationsByStatus {
  const map = defaultApplicationsByStatus();
  for (const row of rows) {
    if (row.status in map) {
      map[row.status as keyof ApplicationsByStatus] = Number(row.count);
    }
  }
  return map;
}

export async function getMetrics(userId: string): Promise<DashboardMetrics> {
  const cached = await getCachedMetrics(userId);
  if (cached !== null) return cached;

  const [byStatusRows, totalAppsResult, totalInterviewsResult] = await Promise.all([
    db
      .select({
        status: applications.status,
        count: count(),
      })
      .from(applications)
      .where(eq(applications.userId, userId))
      .groupBy(applications.status),
    db
      .select({ count: count() })
      .from(applications)
      .where(eq(applications.userId, userId)),
    db
      .select({ count: count() })
      .from(interviews)
      .where(eq(interviews.userId, userId)),
  ]);

  const totalApplications = Number(totalAppsResult[0]?.count ?? 0);
  const totalInterviews = Number(totalInterviewsResult[0]?.count ?? 0);
  const applicationsByStatus = statusCountsToMap(
    byStatusRows.map((r) => ({ status: r.status, count: Number(r.count) }))
  );
  const activeApplications =
    applicationsByStatus.applied + applicationsByStatus.interviewing;
  const offersReceived = applicationsByStatus.offer;
  const rejectionsReceived = applicationsByStatus.rejected;
  const interviewRate =
    totalApplications === 0 ? 0 : totalInterviews / totalApplications;

  const metrics: DashboardMetrics = {
    totalApplications,
    applicationsByStatus,
    interviewRate,
    activeApplications,
    offersReceived,
    rejectionsReceived,
  };

  await setCachedMetrics(userId, metrics);
  return metrics;
}
