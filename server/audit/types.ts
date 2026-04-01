export type AuditAction =
  | "application.deleted"
  | "application.status_changed"
  | "company.deleted"
  | "interview.deleted"
  | "note.deleted"
  | "resume.deleted";

export type AuditEntityType =
  | "application"
  | "company"
  | "interview"
  | "note"
  | "resume";
