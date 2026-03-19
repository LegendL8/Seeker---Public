import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import * as schema from "../db/schema";
import { auditLogs } from "../db/schema";
import type { AuditAction, AuditEntityType } from "./types";

export type DbExecutor = NodePgDatabase<typeof schema>;

export interface InsertAuditLogInput {
  actorUserId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  details: Record<string, unknown> | null;
}

export async function insertAuditLog(
  executor: DbExecutor,
  input: InsertAuditLogInput,
): Promise<void> {
  await executor.insert(auditLogs).values({
    actorUserId: input.actorUserId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    details: input.details,
  });
}
