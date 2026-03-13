import { and, count, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { db } from "../db";
import { resumes } from "../db/schema";
import { ForbiddenError, NotFoundError } from "../errors";
import { deleteResumeFromS3, getResumeSignedUrl, uploadResumeToS3 } from "./s3";
import type { ResumeFileType } from "./types";
import { FREE_TIER_RESUME_CAP } from "./types";

export type ResumeRow = typeof resumes.$inferSelect;

export async function listResumes(userId: string): Promise<ResumeRow[]> {
  return db
    .select()
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .orderBy(desc(resumes.createdAt));
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
  if (total >= FREE_TIER_RESUME_CAP) {
    throw new ForbiddenError(
      `Free tier is limited to ${FREE_TIER_RESUME_CAP} resume. Delete an existing resume to upload another.`,
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
  await getResumeById(userId, id);
  if (isActive) {
    await db
      .update(resumes)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(resumes.userId, userId));
  }
  const [row] = await db
    .update(resumes)
    .set({ isActive, updatedAt: new Date() })
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
