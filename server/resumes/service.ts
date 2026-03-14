import { and, count, desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { db } from "../db";
import { resumes } from "../db/schema";
import { ForbiddenError, NotFoundError } from "../errors";
import { deleteResumeFromS3, getResumeSignedUrl, uploadResumeToS3 } from "./s3";
import type { ResumeFileType } from "./types";
import { RESUME_CAP } from "./types";

export type ResumeRow = typeof resumes.$inferSelect;

export async function listResumes(
  userId: string,
  page: number,
  limit: number,
): Promise<{ items: ResumeRow[]; total: number }> {
  const offset = (page - 1) * limit;
  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(resumes)
      .where(eq(resumes.userId, userId))
      .orderBy(desc(resumes.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(resumes)
      .where(eq(resumes.userId, userId)),
  ]);
  const total = totalResult[0]?.count ?? 0;
  return { items, total };
}

export async function getResumeById(
  userId: string,
  id: string,
): Promise<ResumeRow> {
  const [row] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)))
    .limit(1);
  if (!row) throw new NotFoundError("Resume not found");
  return row;
}

export async function createResume(
  userId: string,
  buffer: Buffer,
  fileName: string,
  fileType: ResumeFileType,
  fileSizeBytes: number,
): Promise<ResumeRow> {
  const [{ count: total }] = await db
    .select({ count: count() })
    .from(resumes)
    .where(eq(resumes.userId, userId));
  if (total >= RESUME_CAP) {
    throw new ForbiddenError(
      `Resume limit is ${RESUME_CAP} per user. Delete an existing resume to upload another.`,
    );
  }

  const id = randomUUID();
  const ext = fileType;
  const s3Key = `resumes/${userId}/${id}.${ext}`;
  const contentType =
    fileType === "pdf"
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  await uploadResumeToS3(s3Key, buffer, contentType);

  const now = new Date();
  const [row] = await db
    .insert(resumes)
    .values({
      id,
      userId,
      fileName,
      fileType,
      s3Key,
      fileSizeBytes,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!row) throw new Error("Failed to insert resume");
  return row;
}

export async function getResumeWithSignedUrl(
  userId: string,
  id: string,
): Promise<ResumeRow & { signedUrl: string }> {
  const row = await getResumeById(userId, id);
  const signedUrl = await getResumeSignedUrl(row.s3Key);
  return { ...row, signedUrl };
}

export async function setActiveResume(
  userId: string,
  id: string,
  isActive: boolean,
): Promise<ResumeRow> {
  const now = new Date();
  if (isActive) {
    const updated = await db
      .update(resumes)
      .set({
        isActive: sql`(${resumes.id} = ${id})`,
        updatedAt: now,
      })
      .where(eq(resumes.userId, userId))
      .returning();
    const row = updated.find((r) => r.id === id);
    if (!row) throw new NotFoundError("Resume not found");
    return row;
  }
  const [row] = await db
    .update(resumes)
    .set({ isActive: false, updatedAt: now })
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)))
    .returning();
  if (!row) throw new NotFoundError("Resume not found");
  return row;
}

export async function deleteResume(userId: string, id: string): Promise<void> {
  const row = await getResumeById(userId, id);
  await deleteResumeFromS3(row.s3Key);
  await db
    .delete(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)));
}
