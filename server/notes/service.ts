import { and, count, desc, eq } from "drizzle-orm";

import { insertAuditLog } from "../audit/service";
import { db } from "../db";
import { companies, notes as notesTable } from "../db/schema";
import { NotFoundError, ValidationError } from "../errors";
import { getApplicationById } from "../applications/service";
import { getInterviewById } from "../interviews/service";
import type { CreateNoteBody, ListNotesQuery, UpdateNoteBody } from "./types";

export type NoteRow = typeof notesTable.$inferSelect;

async function ensureCompanyOwnership(
  userId: string,
  companyId: string,
): Promise<void> {
  const [row] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(and(eq(companies.id, companyId), eq(companies.userId, userId)))
    .limit(1);
  if (!row) throw new ValidationError("Company not found or access denied");
}

export async function listNotes(
  userId: string,
  query: ListNotesQuery,
): Promise<{ items: NoteRow[]; total: number; page: number; limit: number }> {
  const offset = (query.page - 1) * query.limit;
  const conditions = [eq(notesTable.userId, userId)];
  if (query.typeTag) conditions.push(eq(notesTable.typeTag, query.typeTag));
  if (query.applicationId)
    conditions.push(eq(notesTable.applicationId, query.applicationId));
  if (query.interviewId)
    conditions.push(eq(notesTable.interviewId, query.interviewId));
  if (query.companyId)
    conditions.push(eq(notesTable.companyId, query.companyId));

  const whereClause =
    conditions.length === 1 ? conditions[0] : and(...conditions);

  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(notesTable)
      .where(whereClause)
      .orderBy(desc(notesTable.updatedAt), desc(notesTable.createdAt))
      .limit(query.limit)
      .offset(offset),
    db.select({ count: count() }).from(notesTable).where(whereClause),
  ]);
  const total = totalResult[0]?.count ?? 0;
  return { items, total, page: query.page, limit: query.limit };
}

export async function getNoteById(
  userId: string,
  id: string,
): Promise<NoteRow> {
  const [row] = await db
    .select()
    .from(notesTable)
    .where(and(eq(notesTable.id, id), eq(notesTable.userId, userId)))
    .limit(1);
  if (!row) throw new NotFoundError("Note not found");
  return row;
}

export async function createNote(
  userId: string,
  body: CreateNoteBody,
): Promise<NoteRow> {
  if (body.applicationId) {
    await getApplicationById(userId, body.applicationId);
  }
  if (body.interviewId) {
    await getInterviewById(userId, body.interviewId);
  }
  if (body.companyId) {
    await ensureCompanyOwnership(userId, body.companyId);
  }

  const [row] = await db
    .insert(notesTable)
    .values({
      userId,
      content: body.content,
      typeTag: body.typeTag,
      applicationId: body.applicationId ?? null,
      interviewId: body.interviewId ?? null,
      companyId: body.companyId ?? null,
    })
    .returning();
  if (!row) throw new NotFoundError("Failed to create note");
  return row;
}

export async function updateNote(
  userId: string,
  id: string,
  body: UpdateNoteBody,
): Promise<NoteRow> {
  const existing = await getNoteById(userId, id);

  const relationalCount = [
    body.applicationId,
    body.interviewId,
    body.companyId,
  ].filter((v) => v != null && v !== "").length;
  if (relationalCount > 1) {
    throw new ValidationError(
      "Only one relational tag (applicationId, interviewId, companyId) allowed",
    );
  }

  if (body.applicationId !== undefined) {
    if (body.applicationId)
      await getApplicationById(userId, body.applicationId);
  }
  if (body.interviewId !== undefined) {
    if (body.interviewId) await getInterviewById(userId, body.interviewId);
  }
  if (body.companyId !== undefined) {
    if (body.companyId) await ensureCompanyOwnership(userId, body.companyId);
  }

  const update: Record<string, unknown> = {};
  if (body.content !== undefined) update.content = body.content;
  if (body.typeTag !== undefined) update.typeTag = body.typeTag;
  if (body.applicationId !== undefined)
    update.applicationId = body.applicationId;
  if (body.interviewId !== undefined) update.interviewId = body.interviewId;
  if (body.companyId !== undefined) update.companyId = body.companyId;
  if (Object.keys(update).length === 0) {
    return existing;
  }
  update.updatedAt = new Date();

  const [row] = await db
    .update(notesTable)
    .set(update)
    .where(and(eq(notesTable.id, id), eq(notesTable.userId, userId)))
    .returning();
  if (!row) throw new NotFoundError("Note not found");
  return row;
}

export async function deleteNote(userId: string, id: string): Promise<void> {
  await db.transaction(async (tx) => {
    const result = await tx
      .delete(notesTable)
      .where(and(eq(notesTable.id, id), eq(notesTable.userId, userId)))
      .returning({
        id: notesTable.id,
        typeTag: notesTable.typeTag,
        applicationId: notesTable.applicationId,
        interviewId: notesTable.interviewId,
        companyId: notesTable.companyId,
      });
    if (result.length === 0) throw new NotFoundError("Note not found");
    const row = result[0]!;
    await insertAuditLog(tx, {
      actorUserId: userId,
      action: "note.deleted",
      entityType: "note",
      entityId: row.id,
      details: {
        typeTag: row.typeTag,
        applicationId: row.applicationId,
        interviewId: row.interviewId,
        companyId: row.companyId,
      },
    });
  });
}
