import { and, desc, eq } from 'drizzle-orm';

import { invalidateDashboardCache } from '../dashboard/cache';
import { db } from '../db';
import { interviews } from '../db/schema';
import { NotFoundError } from '../errors';
import type { CreateInterviewBody, UpdateInterviewBody } from './types';

export type InterviewRow = typeof interviews.$inferSelect;

export async function listInterviewsByApplicationId(
  userId: string,
  applicationId: string
): Promise<InterviewRow[]> {
  const rows = await db
    .select()
    .from(interviews)
    .where(
      and(
        eq(interviews.applicationId, applicationId),
        eq(interviews.userId, userId)
      )
    )
    .orderBy(desc(interviews.scheduledAt), desc(interviews.createdAt));
  return rows;
}

export async function getInterviewById(
  userId: string,
  id: string
): Promise<InterviewRow> {
  const [row] = await db
    .select()
    .from(interviews)
    .where(and(eq(interviews.id, id), eq(interviews.userId, userId)))
    .limit(1);
  if (!row) throw new NotFoundError('Interview not found');
  return row;
}

export async function createInterview(
  userId: string,
  applicationId: string,
  body: CreateInterviewBody
): Promise<InterviewRow> {
  const [row] = await db
    .insert(interviews)
    .values({
      userId,
      applicationId,
      interviewType: body.interviewType,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      interviewerName: body.interviewerName ?? null,
      interviewerTitle: body.interviewerTitle ?? null,
      outcome: body.outcome ?? 'pending',
    })
    .returning();
  if (!row) throw new NotFoundError('Failed to create interview');
  await invalidateDashboardCache(userId);
  return row;
}

export async function updateInterview(
  userId: string,
  id: string,
  body: UpdateInterviewBody
): Promise<InterviewRow> {
  await getInterviewById(userId, id);
  const update: Record<string, unknown> = {};
  if (body.interviewType !== undefined) update.interviewType = body.interviewType;
  if (body.scheduledAt !== undefined)
    update.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
  if (body.interviewerName !== undefined)
    update.interviewerName = body.interviewerName;
  if (body.interviewerTitle !== undefined)
    update.interviewerTitle = body.interviewerTitle;
  if (body.outcome !== undefined) update.outcome = body.outcome;
  if (Object.keys(update).length === 0) {
    return getInterviewById(userId, id);
  }
  update.updatedAt = new Date();
  const [row] = await db
    .update(interviews)
    .set(update)
    .where(and(eq(interviews.id, id), eq(interviews.userId, userId)))
    .returning();
  if (!row) throw new NotFoundError('Interview not found');
  await invalidateDashboardCache(userId);
  return row;
}

export async function deleteInterview(
  userId: string,
  id: string
): Promise<void> {
  const result = await db
    .delete(interviews)
    .where(and(eq(interviews.id, id), eq(interviews.userId, userId)))
    .returning({ id: interviews.id });
  if (result.length === 0) throw new NotFoundError('Interview not found');
  await invalidateDashboardCache(userId);
}
