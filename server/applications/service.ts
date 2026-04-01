import { and, count, desc, eq, lt, or } from "drizzle-orm";

import { insertAuditLog } from "../audit/service";
import { ensureCompanyOwnership } from "../companies/service";
import { invalidateDashboardCache } from "../dashboard/cache";
import { db } from "../db";
import { applications } from "../db/schema";
import { NotFoundError, ValidationError } from "../errors";
import type { CreateApplicationBody, UpdateApplicationBody } from "./types";

export type ApplicationRow = typeof applications.$inferSelect;

const CURSOR_PREFIX = "v1:";

function encodeCursor(row: {
  id: string;
  updatedAt: Date | null;
  createdAt: Date | null;
}): string {
  const ts = row.updatedAt ?? row.createdAt ?? new Date(0);
  return (
    CURSOR_PREFIX +
    Buffer.from(
      JSON.stringify({ updatedAt: ts.toISOString(), id: row.id }),
      "utf-8",
    ).toString("base64url")
  );
}

function decodeCursor(cursor: string): { updatedAt: Date; id: string } | null {
  if (!cursor.startsWith(CURSOR_PREFIX)) return null;
  try {
    const raw = Buffer.from(
      cursor.slice(CURSOR_PREFIX.length),
      "base64url",
    ).toString("utf-8");
    const parsed = JSON.parse(raw) as { updatedAt?: string; id?: string };
    if (typeof parsed.updatedAt !== "string" || typeof parsed.id !== "string") {
      return null;
    }
    const updatedAt = new Date(parsed.updatedAt);
    if (Number.isNaN(updatedAt.getTime())) return null;
    return { updatedAt, id: parsed.id };
  } catch {
    return null;
  }
}

export async function listApplications(
  userId: string,
  page: number,
  limit: number,
): Promise<{ items: ApplicationRow[]; total: number }> {
  const offset = (page - 1) * limit;
  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.updatedAt), desc(applications.id))
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

export async function listApplicationsByCursor(
  userId: string,
  cursor: string,
  limit: number,
): Promise<{ items: ApplicationRow[]; nextCursor: string | null }> {
  const decoded = decodeCursor(cursor);
  if (!decoded) {
    throw new ValidationError("Invalid cursor");
  }
  const cursorCondition = or(
    lt(applications.updatedAt, decoded.updatedAt),
    and(
      eq(applications.updatedAt, decoded.updatedAt),
      lt(applications.id, decoded.id),
    ),
  );
  const rows = await db
    .select()
    .from(applications)
    .where(and(eq(applications.userId, userId), cursorCondition))
    .orderBy(desc(applications.updatedAt), desc(applications.id))
    .limit(limit + 1);
  const items = rows.slice(0, limit);
  const nextCursor = rows.length > limit ? encodeCursor(rows[limit - 1]) : null;
  return { items, nextCursor };
}

export async function getApplicationById(
  userId: string,
  id: string,
): Promise<ApplicationRow> {
  const [row] = await db
    .select()
    .from(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .limit(1);
  if (!row) throw new NotFoundError("Application not found");
  return row;
}

export async function createApplication(
  userId: string,
  body: CreateApplicationBody,
): Promise<ApplicationRow> {
  if (body.companyId) {
    await ensureCompanyOwnership(userId, body.companyId);
  }
  const [row] = await db
    .insert(applications)
    .values({
      userId,
      jobTitle: body.jobTitle,
      status: body.status ?? "saved",
      companyId: body.companyId ?? null,
      jobPostingUrl: body.jobPostingUrl ?? null,
      location: body.location ?? null,
      salaryMin: body.salaryMin ?? null,
      salaryMax: body.salaryMax ?? null,
      salaryPeriod: body.salaryPeriod ?? "yearly",
      appliedAt: body.appliedAt ? new Date(body.appliedAt) : null,
      source: body.source ?? null,
      resumeId: body.resumeId ?? null,
    })
    .returning();
  if (!row) throw new NotFoundError("Failed to create application");
  await invalidateDashboardCache(userId);
  return row;
}

export async function updateApplication(
  userId: string,
  id: string,
  body: UpdateApplicationBody,
): Promise<ApplicationRow> {
  const existing = await getApplicationById(userId, id);
  if (body.companyId !== undefined && body.companyId !== null) {
    await ensureCompanyOwnership(userId, body.companyId);
  }
  const update: Record<string, unknown> = {};
  if (body.jobTitle !== undefined) update.jobTitle = body.jobTitle;
  if (body.status !== undefined) update.status = body.status;
  if (body.companyId !== undefined) update.companyId = body.companyId;
  if (body.jobPostingUrl !== undefined)
    update.jobPostingUrl = body.jobPostingUrl;
  if (body.location !== undefined) update.location = body.location;
  if (body.salaryMin !== undefined) update.salaryMin = body.salaryMin;
  if (body.salaryMax !== undefined) update.salaryMax = body.salaryMax;
  if (body.salaryPeriod !== undefined) update.salaryPeriod = body.salaryPeriod;
  if (body.appliedAt !== undefined)
    update.appliedAt = body.appliedAt ? new Date(body.appliedAt) : null;
  if (body.source !== undefined) update.source = body.source;
  if (body.resumeId !== undefined) update.resumeId = body.resumeId;
  if (Object.keys(update).length === 0) return existing;
  update.updatedAt = new Date();

  const statusChanged =
    body.status !== undefined && body.status !== existing.status;

  if (statusChanged) {
    let row: ApplicationRow;
    await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(applications)
        .set(update)
        .where(and(eq(applications.id, id), eq(applications.userId, userId)))
        .returning();
      if (!updated) throw new NotFoundError("Application not found");
      await insertAuditLog(tx, {
        actorUserId: userId,
        action: "application.status_changed",
        entityType: "application",
        entityId: id,
        details: {
          fromStatus: existing.status,
          toStatus: updated.status,
        },
      });
      row = updated;
    });
    await invalidateDashboardCache(userId);
    return row!;
  }

  const [row] = await db
    .update(applications)
    .set(update)
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .returning();
  if (!row) throw new NotFoundError("Application not found");
  await invalidateDashboardCache(userId);
  return row;
}

export async function deleteApplication(
  userId: string,
  id: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    const removed = await tx
      .delete(applications)
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .returning({
        id: applications.id,
        jobTitle: applications.jobTitle,
        status: applications.status,
      });
    if (removed.length === 0) throw new NotFoundError("Application not found");
    const row = removed[0]!;
    await insertAuditLog(tx, {
      actorUserId: userId,
      action: "application.deleted",
      entityType: "application",
      entityId: row.id,
      details: {
        jobTitle: row.jobTitle,
        status: row.status,
      },
    });
  });
  await invalidateDashboardCache(userId);
}
