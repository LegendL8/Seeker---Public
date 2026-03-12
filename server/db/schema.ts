import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const timestamptz = (name: string) =>
  timestamp(name, { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  auth0Id: varchar("auth0_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }),
  subscriptionTier: varchar("subscription_tier", { length: 20 })
    .notNull()
    .default("free"),
  createdAt: timestamptz("created_at"),
  updatedAt: timestamptz("updated_at"),
});

export const preferences = pgTable(
  "preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postingCheckFrequency: varchar("posting_check_frequency", { length: 20 })
      .notNull()
      .default("daily"),
    createdAt: timestamptz("created_at"),
    updatedAt: timestamptz("updated_at"),
  },
  (t) => [uniqueIndex("idx_preferences_user_id").on(t.userId)]
);

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  website: varchar("website", { length: 500 }),
  industry: varchar("industry", { length: 255 }),
  createdAt: timestamptz("created_at"),
  updatedAt: timestamptz("updated_at"),
});

export const resumes = pgTable("resumes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 10 }).notNull(),
  s3Key: varchar("s3_key", { length: 500 }).notNull(),
  fileSizeBytes: integer("file_size_bytes").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamptz("created_at"),
  updatedAt: timestamptz("updated_at"),
});

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    jobTitle: varchar("job_title", { length: 255 }).notNull(),
    jobPostingUrl: varchar("job_posting_url", { length: 500 }),
    postingStatus: varchar("posting_status", { length: 20 })
      .notNull()
      .default("unknown"),
    postingStatusCheckedAt: timestamp("posting_status_checked_at", {
      withTimezone: true,
    }),
    location: varchar("location", { length: 255 }),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    status: varchar("status", { length: 20 }).notNull().default("saved"),
    appliedAt: timestamp("applied_at", { withTimezone: true }),
    source: varchar("source", { length: 255 }),
    resumeId: uuid("resume_id").references(() => resumes.id, {
      onDelete: "set null",
    }),
    createdAt: timestamptz("created_at"),
    updatedAt: timestamptz("updated_at"),
  },
  (t) => [
    index("idx_applications_user_id").on(t.userId),
    index("idx_applications_status").on(t.status),
    index("idx_applications_company_id").on(t.companyId),
    index("idx_applications_posting_status").on(t.postingStatus),
  ]
);

export const interviews = pgTable(
  "interviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    interviewType: varchar("interview_type", { length: 20 }).notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    interviewerName: varchar("interviewer_name", { length: 255 }),
    interviewerTitle: varchar("interviewer_title", { length: 255 }),
    outcome: varchar("outcome", { length: 20 }).notNull().default("pending"),
    createdAt: timestamptz("created_at"),
    updatedAt: timestamptz("updated_at"),
  },
  (t) => [
    index("idx_interviews_application_id").on(t.applicationId),
    index("idx_interviews_user_id").on(t.userId),
  ]
);

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    typeTag: varchar("type_tag", { length: 50 }).notNull(),
    applicationId: uuid("application_id").references(() => applications.id, {
      onDelete: "set null",
    }),
    interviewId: uuid("interview_id").references(() => interviews.id, {
      onDelete: "set null",
    }),
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    createdAt: timestamptz("created_at"),
    updatedAt: timestamptz("updated_at"),
  },
  (t) => [
    index("idx_notes_user_id").on(t.userId),
    index("idx_notes_type_tag").on(t.userId, t.typeTag),
    index("idx_notes_application_id").on(t.applicationId),
    index("idx_notes_interview_id").on(t.interviewId),
    index("idx_notes_company_id").on(t.companyId),
  ]
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    entityType: varchar("entity_type", { length: 50 }),
    entityId: uuid("entity_id"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamptz("created_at"),
  },
  (t) => [
    index("idx_notifications_user_id").on(t.userId),
    index("idx_notifications_is_read").on(t.userId, t.isRead),
  ]
);
