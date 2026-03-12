import { and, count, desc, eq } from 'drizzle-orm';

import { invalidateDashboardCache } from '../dashboard/cache';
import { db } from '../db';
import { applications } from '../db/schema';
import { NotFoundError } from '../errors';
import type { CreateApplicationBody, UpdateApplicationBody } from './types';

export type ApplicationRow = typeof applications.$inferSelect;

export async function listApplications(
  userId: string,
  page: number,
  limit: number
): Promise<{ items: ApplicationRow[]; total: number }> {
  const offset = (page - 1) * limit;
  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.updatedAt), desc(applications.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(applications)
      .where(eq(applications.userId, userId)),
  ]);
  const total = totalResult[0]?.count ?? 0;
  return { items, total };
}

export async function getApplicationById(
  userId: string,
  id: string
): Promise<ApplicationRow> {
  const [row] = await db
    .select()
    .from(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .limit(1);
  if (!row) throw new NotFoundError('Application not found');
  return row;
}

export async function createApplication(
  userId: string,
  body: CreateApplicationBody
): Promise<ApplicationRow> {
  const [row] = await db
    .insert(applications)
    .values({
      userId,
      jobTitle: body.jobTitle,
      status: body.status ?? 'saved',
      companyId: body.companyId ?? null,
      jobPostingUrl: body.jobPostingUrl ?? null,
      location: body.location ?? null,
      salaryMin: body.salaryMin ?? null,
      salaryMax: body.salaryMax ?? null,
      appliedAt: body.appliedAt ? new Date(body.appliedAt) : null,
      source: body.source ?? null,
      resumeId: body.resumeId ?? null,
    })
    .returning();
  if (!row) throw new NotFoundError('Failed to create application');
  await invalidateDashboardCache(userId);
  return row;
}

export async function updateApplication(
  userId: string,
  id: string,
  body: UpdateApplicationBody
): Promise<ApplicationRow> {
  const existing = await getApplicationById(userId, id);
  const update: Record<string, unknown> = {};
  if (body.jobTitle !== undefined) update.jobTitle = body.jobTitle;
  if (body.status !== undefined) update.status = body.status;
  if (body.companyId !== undefined) update.companyId = body.companyId;
  if (body.jobPostingUrl !== undefined) update.jobPostingUrl = body.jobPostingUrl;
  if (body.location !== undefined) update.location = body.location;
  if (body.salaryMin !== undefined) update.salaryMin = body.salaryMin;
  if (body.salaryMax !== undefined) update.salaryMax = body.salaryMax;
  if (body.appliedAt !== undefined)
    update.appliedAt = body.appliedAt ? new Date(body.appliedAt) : null;
  if (body.source !== undefined) update.source = body.source;
  if (body.resumeId !== undefined) update.resumeId = body.resumeId;
  if (Object.keys(update).length === 0) return existing;
  update.updatedAt = new Date();
  const [row] = await db
    .update(applications)
    .set(update)
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .returning();
  if (!row) throw new NotFoundError('Application not found');
  await invalidateDashboardCache(userId);
  return row;
}

export async function deleteApplication(
  userId: string,
  id: string
): Promise<void> {
  const result = await db
    .delete(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .returning({ id: applications.id });
  if (result.length === 0) throw new NotFoundError('Application not found');
  await invalidateDashboardCache(userId);
}
