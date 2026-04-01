import { and, count, desc, eq, sql } from "drizzle-orm";

import { insertAuditLog } from "../audit/service";
import { db } from "../db";
import { companies as companiesTable } from "../db/schema";
import { AppError, NotFoundError } from "../errors";
import type { CreateCompanyBody, UpdateCompanyBody } from "./types";

export type CompanyRow = typeof companiesTable.$inferSelect;

export async function ensureCompanyOwnership(
  userId: string,
  companyId: string,
): Promise<void> {
  const [row] = await db
    .select({ id: companiesTable.id })
    .from(companiesTable)
    .where(
      and(eq(companiesTable.id, companyId), eq(companiesTable.userId, userId)),
    )
    .limit(1);
  if (!row) throw new NotFoundError("Company not found");
}

export async function listCompanies(
  userId: string,
  page: number,
  limit: number,
  q?: string,
): Promise<{ items: CompanyRow[]; total: number }> {
  const offset = (page - 1) * limit;
  const searchTerm =
    typeof q === "string" && q.trim().length > 0
      ? q.trim().toLowerCase()
      : undefined;

  const userFilter = eq(companiesTable.userId, userId);
  const whereClause =
    searchTerm !== undefined
      ? and(
          userFilter,
          sql`(
            strpos(lower(${companiesTable.name}), ${searchTerm}) > 0
            OR strpos(lower(coalesce(${companiesTable.website}, '')), ${searchTerm}) > 0
            OR strpos(lower(coalesce(${companiesTable.industry}, '')), ${searchTerm}) > 0
          )`,
        )
      : userFilter;

  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(companiesTable)
      .where(whereClause)
      .orderBy(desc(companiesTable.updatedAt), desc(companiesTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(companiesTable).where(whereClause),
  ]);
  const total = totalResult[0]?.count ?? 0;
  return { items, total };
}

export async function getCompanyById(
  userId: string,
  id: string,
): Promise<CompanyRow> {
  const [row] = await db
    .select()
    .from(companiesTable)
    .where(and(eq(companiesTable.id, id), eq(companiesTable.userId, userId)))
    .limit(1);
  if (!row) throw new NotFoundError("Company not found");
  return row;
}

export async function createCompany(
  userId: string,
  body: CreateCompanyBody,
): Promise<CompanyRow> {
  const [row] = await db
    .insert(companiesTable)
    .values({
      userId,
      name: body.name,
      website: body.website ?? null,
      industry: body.industry ?? null,
    })
    .returning();
  if (!row) {
    throw new AppError("INTERNAL_ERROR", "Failed to create company", 500);
  }
  return row;
}

export async function updateCompany(
  userId: string,
  id: string,
  body: UpdateCompanyBody,
): Promise<CompanyRow> {
  const existing = await getCompanyById(userId, id);
  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.website !== undefined) update.website = body.website;
  if (body.industry !== undefined) update.industry = body.industry;
  if (Object.keys(update).length === 0) return existing;
  update.updatedAt = new Date();
  const [row] = await db
    .update(companiesTable)
    .set(update)
    .where(and(eq(companiesTable.id, id), eq(companiesTable.userId, userId)))
    .returning();
  if (!row) throw new NotFoundError("Company not found");
  return row;
}

export async function deleteCompany(userId: string, id: string): Promise<void> {
  await db.transaction(async (tx) => {
    const result = await tx
      .delete(companiesTable)
      .where(and(eq(companiesTable.id, id), eq(companiesTable.userId, userId)))
      .returning({
        id: companiesTable.id,
        name: companiesTable.name,
      });
    if (result.length === 0) throw new NotFoundError("Company not found");
    const row = result[0]!;
    await insertAuditLog(tx, {
      actorUserId: userId,
      action: "company.deleted",
      entityType: "company",
      entityId: row.id,
      details: { name: row.name },
    });
  });
}
