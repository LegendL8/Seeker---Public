import { eq } from "drizzle-orm";

import { db } from "../db";
import { preferences, resumes, users } from "../db/schema";
import { AppError, NotFoundError } from "../errors";
import { deleteResumeFromR2 } from "../resumes/r2";
import type { PreferencesResponse } from "./types";

export async function updateCurrentUserDisplayName(
  userId: string,
  displayName: string | null,
): Promise<typeof users.$inferSelect> {
  const [updated] = await db
    .update(users)
    .set({ displayName })
    .where(eq(users.id, userId))
    .returning();
  if (!updated) {
    throw new NotFoundError("User not found");
  }
  return updated;
}

export async function getUserPreferences(
  userId: string,
): Promise<PreferencesResponse> {
  const [row] = await db
    .select({ postingCheckFrequency: preferences.postingCheckFrequency })
    .from(preferences)
    .where(eq(preferences.userId, userId))
    .limit(1);
  if (!row) {
    throw new NotFoundError("Preferences not found");
  }
  return {
    postingCheckFrequency: row.postingCheckFrequency as
      | "hourly"
      | "daily"
      | "weekly",
  };
}

export async function updateUserPreferences(
  userId: string,
  postingCheckFrequency: "hourly" | "daily" | "weekly",
): Promise<PreferencesResponse> {
  const [updated] = await db
    .update(preferences)
    .set({ postingCheckFrequency })
    .where(eq(preferences.userId, userId))
    .returning({ postingCheckFrequency: preferences.postingCheckFrequency });
  if (!updated) {
    throw new NotFoundError("Preferences not found");
  }
  return {
    postingCheckFrequency: updated.postingCheckFrequency as
      | "hourly"
      | "daily"
      | "weekly",
  };
}

export async function deleteCurrentUserAccount(userId: string): Promise<void> {
  const userResumes = await db
    .select({ id: resumes.id, s3Key: resumes.s3Key })
    .from(resumes)
    .where(eq(resumes.userId, userId));

  for (const resume of userResumes) {
    try {
      await deleteResumeFromR2(resume.s3Key);
    } catch {
      throw new AppError(
        "EXTERNAL_STORAGE_ERROR",
        "Failed to delete account data from object storage",
        502,
      );
    }
  }

  const deleted = await db
    .delete(users)
    .where(eq(users.id, userId))
    .returning({ id: users.id });

  if (deleted.length === 0) {
    throw new NotFoundError("User not found");
  }
}
