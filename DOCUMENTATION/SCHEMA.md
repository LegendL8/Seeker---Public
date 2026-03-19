# Seeker — Database Schema

## Design Principles

- PostgreSQL normalized schema
- Drizzle ORM for all table definitions
- No TypeScript enums — all status fields use union types
- All tables include `created_at` and `updated_at` timestamps
- All IDs are UUIDs
- Hard deletes at this stage — no soft deletes

---

## Entity Relationship Overview

```
users
  └── applications (one to many)
        └── interviews (one to many)
  └── resumes (one to many)
  └── notifications (one to many)
  └── notes (one to many — standalone, tagged to records)
  └── companies (one to many)
  └── preferences (one to one)

notes
  └── type_tag — categorizes the note
  └── application_id (nullable FK)
  └── interview_id (nullable FK)
  └── company_id (nullable FK)
```

---

## Tables

### users

Stores authenticated user profiles. Created on first Auth0 login.

| Column            | Type         | Constraints                            | Notes                                |
| ----------------- | ------------ | -------------------------------------- | ------------------------------------ |
| id                | uuid         | PRIMARY KEY, DEFAULT gen_random_uuid() |                                      |
| auth0_id          | varchar(255) | UNIQUE, NOT NULL                       | Never exposed in API responses       |
| email             | varchar(255) | UNIQUE, NOT NULL                       |                                      |
| display_name      | varchar(255) |                                        |                                      |
| subscription_tier | varchar(20)  | NOT NULL, DEFAULT 'free'               | Reserved; all users have full access |
| created_at        | timestamptz  | NOT NULL, DEFAULT now()                |                                      |
| updated_at        | timestamptz  | NOT NULL, DEFAULT now()                |                                      |

---

### preferences

Stores user-level settings. One row per user, created on first login.

| Column                  | Type        | Constraints                                              | Notes            |
| ----------------------- | ----------- | -------------------------------------------------------- | ---------------- | ------- | --------- |
| id                      | uuid        | PRIMARY KEY, DEFAULT gen_random_uuid()                   |                  |
| user_id                 | uuid        | NOT NULL, UNIQUE, REFERENCES users(id) ON DELETE CASCADE | One row per user |
| posting_check_frequency | varchar(20) | NOT NULL, DEFAULT 'daily'                                | `"hourly"        | "daily" | "weekly"` |
| created_at              | timestamptz | NOT NULL, DEFAULT now()                                  |                  |
| updated_at              | timestamptz | NOT NULL, DEFAULT now()                                  |                  |

---

### companies

Stores company information referenced by applications and notes.

| Column     | Type         | Constraints                                      | Notes                  |
| ---------- | ------------ | ------------------------------------------------ | ---------------------- |
| id         | uuid         | PRIMARY KEY, DEFAULT gen_random_uuid()           |                        |
| user_id    | uuid         | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Companies are per user |
| name       | varchar(255) | NOT NULL                                         |                        |
| website    | varchar(500) |                                                  |                        |
| industry   | varchar(255) |                                                  |                        |
| created_at | timestamptz  | NOT NULL, DEFAULT now()                          |                        |
| updated_at | timestamptz  | NOT NULL, DEFAULT now()                          |                        |

---

### applications

Tracks job applications submitted by the user.

| Column                    | Type         | Constraints                                      | Notes                                                                     |
| ------------------------- | ------------ | ------------------------------------------------ | ------------------------------------------------------------------------- | -------- | -------- | ---------- |
| id                        | uuid         | PRIMARY KEY, DEFAULT gen_random_uuid()           |                                                                           |
| user_id                   | uuid         | NOT NULL, REFERENCES users(id) ON DELETE CASCADE |                                                                           |
| company_id                | uuid         | REFERENCES companies(id) ON DELETE SET NULL      |                                                                           |
| job_title                 | varchar(255) | NOT NULL                                         |                                                                           |
| job_posting_url           | varchar(500) |                                                  |                                                                           |
| posting_status            | varchar(20)  | NOT NULL, DEFAULT 'unknown'                      | `"active"                                                                 | "closed" | "filled" | "unknown"` |
| posting_status_checked_at | timestamptz  |                                                  | Null until first automated check                                          |
| location                  | varchar(255) |                                                  |                                                                           |
| salary_min                | integer      |                                                  | Cents (per year or per hour)                                              |
| salary_max                | integer      |                                                  | Cents (per year or per hour)                                              |
| salary_period             | varchar(20)  | NOT NULL, DEFAULT 'yearly'                       | `"yearly"` \| `"hourly"`                                                  |
| status                    | varchar(20)  | NOT NULL, DEFAULT 'saved'                        | `"saved"` \| `"applied"` \| `"interviewing"` \| `"offer"` \| `"rejected"` |
| applied_at                | timestamptz  |                                                  |                                                                           |
| source                    | varchar(255) |                                                  |                                                                           |
| resume_id                 | uuid         | REFERENCES resumes(id) ON DELETE SET NULL        |                                                                           |
| created_at                | timestamptz  | NOT NULL, DEFAULT now()                          |                                                                           |
| updated_at                | timestamptz  | NOT NULL, DEFAULT now()                          |                                                                           |

---

### interviews

Tracks interviews tied to a job application.

| Column            | Type         | Constraints                                             | Notes                              |
| ----------------- | ------------ | ------------------------------------------------------- | ---------------------------------- | ----------- | ------------ | ---------- | -------- |
| id                | uuid         | PRIMARY KEY, DEFAULT gen_random_uuid()                  |                                    |
| application_id    | uuid         | NOT NULL, REFERENCES applications(id) ON DELETE CASCADE |                                    |
| user_id           | uuid         | NOT NULL, REFERENCES users(id) ON DELETE CASCADE        | Denormalized for query performance |
| interview_type    | varchar(20)  | NOT NULL                                                | `"phone"                           | "technical" | "behavioral" | "onsite"   | "final"` |
| scheduled_at      | timestamptz  |                                                         |                                    |
| interviewer_name  | varchar(255) |                                                         |                                    |
| interviewer_title | varchar(255) |                                                         |                                    |
| outcome           | varchar(20)  | NOT NULL, DEFAULT 'pending'                             | `"pending"                         | "passed"    | "failed"     | "no_show"` |
| created_at        | timestamptz  | NOT NULL, DEFAULT now()                                 |                                    |
| updated_at        | timestamptz  | NOT NULL, DEFAULT now()                                 |                                    |

---

### notes

Standalone notes with a dedicated tab. Each note has one type tag and one optional relational tag.

| Column         | Type        | Constraints                                      | Notes        |
| -------------- | ----------- | ------------------------------------------------ | ------------ | ----------------- | ---------- | ---------- |
| id             | uuid        | PRIMARY KEY, DEFAULT gen_random_uuid()           |              |
| user_id        | uuid        | NOT NULL, REFERENCES users(id) ON DELETE CASCADE |              |
| content        | text        | NOT NULL                                         |              |
| type_tag       | varchar(50) | NOT NULL                                         | `"interview" | "job_description" | "research" | "general"` |
| application_id | uuid        | REFERENCES applications(id) ON DELETE SET NULL   | Nullable     |
| interview_id   | uuid        | REFERENCES interviews(id) ON DELETE SET NULL     | Nullable     |
| company_id     | uuid        | REFERENCES companies(id) ON DELETE SET NULL      | Nullable     |
| created_at     | timestamptz | NOT NULL, DEFAULT now()                          |              |
| updated_at     | timestamptz | NOT NULL, DEFAULT now()                          |              |

**Business Logic:** Only one relational tag populated per note — enforced at service layer.

---

### resumes

Tracks resume uploads per user.

| Column          | Type         | Constraints                                      | Notes                          |
| --------------- | ------------ | ------------------------------------------------ | ------------------------------ | ------- |
| id              | uuid         | PRIMARY KEY, DEFAULT gen_random_uuid()           |                                |
| user_id         | uuid         | NOT NULL, REFERENCES users(id) ON DELETE CASCADE |                                |
| file_name       | varchar(255) | NOT NULL                                         |                                |
| file_type       | varchar(10)  | NOT NULL                                         | `"pdf"                         | "docx"` |
| s3_key          | varchar(500) | NOT NULL                                         | Never exposed in API responses |
| file_size_bytes | integer      | NOT NULL                                         |                                |
| is_active       | boolean      | NOT NULL, DEFAULT true                           |                                |
| created_at      | timestamptz  | NOT NULL, DEFAULT now()                          |                                |
| updated_at      | timestamptz  | NOT NULL, DEFAULT now()                          |                                |

---

### notifications

Stores in-app notifications per user.

| Column      | Type         | Constraints                                      | Notes            |
| ----------- | ------------ | ------------------------------------------------ | ---------------- | -------------------- | ----------------------- | ---------- |
| id          | uuid         | PRIMARY KEY, DEFAULT gen_random_uuid()           |                  |
| user_id     | uuid         | NOT NULL, REFERENCES users(id) ON DELETE CASCADE |                  |
| type        | varchar(50)  | NOT NULL                                         | `"status_change" | "follow_up_reminder" | "posting_status_change" | "general"` |
| title       | varchar(255) | NOT NULL                                         |                  |
| message     | text         | NOT NULL                                         |                  |
| entity_type | varchar(50)  |                                                  |                  |
| entity_id   | uuid         |                                                  |                  |
| is_read     | boolean      | NOT NULL, DEFAULT false                          |                  |
| created_at  | timestamptz  | NOT NULL, DEFAULT now()                          |                  |

---

## Indexes

```sql
-- users
CREATE UNIQUE INDEX idx_preferences_user_id ON preferences(user_id);

-- applications
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_company_id ON applications(company_id);
CREATE INDEX idx_applications_posting_status ON applications(posting_status);

-- interviews
CREATE INDEX idx_interviews_application_id ON interviews(application_id);
CREATE INDEX idx_interviews_user_id ON interviews(user_id);

-- notes
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_type_tag ON notes(user_id, type_tag);
CREATE INDEX idx_notes_application_id ON notes(application_id);
CREATE INDEX idx_notes_interview_id ON notes(interview_id);
CREATE INDEX idx_notes_company_id ON notes(company_id);

-- resumes
CREATE INDEX idx_resumes_user_id ON resumes(user_id);

-- notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);
```

---

## Business Logic Notes

- Salary stored in cents — avoids floating point precision issues
- Notes relational tag: only one FK populated per note — enforced at service layer
- user_id on interviews: denormalized intentionally for dashboard query performance
- S3 key: never returned in API responses — signed URLs only
- posting_check_frequency: user-configurable; posting_status_checked_at null until first automated check runs
- preferences row: created automatically on first user login alongside the user record

---

## Seed Files

Located in `server/db/seeds/`:

- `seed.fresh.ts` — New user, no data
- `seed.active.ts` — User mid job search, 10 applications in various statuses, 5 interviews, notes across all type tags
- `seed.demo.ts` — Full realistic sample dataset across all entities
