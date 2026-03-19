export type AuditAction =
  | "application.deleted"
  | "application.status_changed"
  | "interview.deleted"
  | "note.deleted"
  | "resume.deleted";

export type AuditEntityType = "application" | "interview" | "note" | "resume";
