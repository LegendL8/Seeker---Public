# Seeker — API Endpoint Plan

## Global Standards

### Base URL

`/api/v1/`

### Authentication

```
Authorization: Bearer <access_token>
```

### Global Security Rules

- **Ownership validation** — every `:id` endpoint verifies the resource belongs to the authenticated user
- **No internal IDs exposed** — `auth0_id` never returned in any response
- **No S3 keys exposed** — only short-lived signed URLs returned, generated server-side
- **Signed URL expiry** — 15 minutes
- **No sensitive fields in logs** — Pino never logs tokens, S3 keys, or PII
- **No cross-user data** — every query scoped to authenticated user's ID

### Pagination

All list endpoints accept `?page=1&limit=20` and return:

```json
{
  "data": [],
  "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

### Standard Error Response

```json
{ "error": "ERROR_CODE", "message": "Description", "statusCode": 400 }
```

### Error Codes

| Code             | Status | Description                                        |
| ---------------- | ------ | -------------------------------------------------- |
| UNAUTHORIZED     | 401    | Missing or invalid JWT                             |
| FORBIDDEN        | 403    | Valid JWT but resource does not belong to user     |
| NOT_FOUND        | 404    | Resource does not exist or does not belong to user |
| VALIDATION_ERROR | 400    | Zod validation failed                              |
| RATE_LIMITED     | 429    | Too many requests                                  |
| INTERNAL_ERROR   | 500    | Unexpected server error                            |

---

## Rate Limits

| Endpoint Group                       | Limit               |
| ------------------------------------ | ------------------- |
| Global                               | 100 req/min per IP  |
| POST /resumes                        | 5 req/min per user  |
| POST /applications/:id/check-posting | 10 req/min per user |
| All other endpoints                  | 60 req/min per user |

**Implemented:** Global 100 req/min per IP applied to all `/api` routes. Applications (GET/POST/PATCH/DELETE `/api/v1/applications`) limited to 60 req/min per authenticated user. 429 response: `{ "error": "RATE_LIMITED", "message": "Too many requests", "statusCode": 429 }`. Login, callback, refresh, and logout are handled by the Next.js Auth0 SDK (not Express); no Express auth routes exist.
_Added 2026-03-09_

---

## Auth

Authentication is handled by the Next.js app using the Auth0 SDK. Login, logout, callback, and token refresh run on the frontend (Next.js) at `/auth/login`, `/auth/logout`, `/auth/callback`; the Express API does not expose auth endpoints.

The API expects `Authorization: Bearer <access_token>` on every protected request. User provisioning happens on the first authenticated request: if the JWT is valid but no user row exists for the token's `sub`, Express creates the user (and optionally preferences) at that time. See ARCHITECTURE.md (Authentication Flow) and DOCUMENTATION/AUTH0.md.

---

## Users

| Method | Route              | Description                  |
| ------ | ------------------ | ---------------------------- |
| GET    | `/api/v1/users/me` | Get current user profile     |
| PATCH  | `/api/v1/users/me` | Update display name or email |
| DELETE | `/api/v1/users/me` | Delete account and all data  |

**Note:** `auth0_id` never returned. DELETE cascades to all user data including preferences.

---

## Preferences

| Method | Route                          | Description             | Auth     |
| ------ | ------------------------------ | ----------------------- | -------- |
| GET    | `/api/v1/users/me/preferences` | Get user preferences    | Required |
| PATCH  | `/api/v1/users/me/preferences` | Update user preferences | Required |

### GET Response

```json
{
  "data": {
    "postingCheckFrequency": "hourly | daily | weekly"
  }
}
```

### PATCH Request

```json
{
  "postingCheckFrequency": "hourly | daily | weekly"
}
```

---

## Companies

| Method | Route                   | Description        |
| ------ | ----------------------- | ------------------ |
| GET    | `/api/v1/companies`     | List all companies |
| POST   | `/api/v1/companies`     | Create a company   |
| GET    | `/api/v1/companies/:id` | Get a company      |
| PATCH  | `/api/v1/companies/:id` | Update a company   |
| DELETE | `/api/v1/companies/:id` | Delete a company   |

**Note:** 404 returned if resource does not exist OR does not belong to user — never reveal existence of other users' data.

---

## Applications

| Method | Route                                    | Description                                                     |
| ------ | ---------------------------------------- | --------------------------------------------------------------- |
| GET    | `/api/v1/applications`                   | List applications — paginated                                   |
| POST   | `/api/v1/applications`                   | Create an application                                           |
| GET    | `/api/v1/applications/:id`               | Get application with interviews                                 |
| PATCH  | `/api/v1/applications/:id`               | Update application                                              |
| DELETE | `/api/v1/applications/:id`               | Delete application                                              |
| POST   | `/api/v1/applications/:id/check-posting` | Trigger manual posting status check — reserved; not implemented |

**Query params (list):** Offset mode: `?page=1&limit=20`. Cursor mode: `?cursor=<opaque>&limit=20` for next page (select O(k); no total). Response with offset: `{ items, page, limit, total }`. Response with cursor: `{ items, nextCursor }` (nextCursor null when no next page).

**Note:** `companyId` and `resumeId` validated to belong to authenticated user before associating. Status changes trigger server-side notifications. Check-posting endpoint not implemented.

**Implemented (list, get, create, update, delete):** List supports both offset (`page`, `limit`) and cursor (`cursor`, `limit`). GET :id returns full application row. Auth required (Bearer). Status union: `saved | applied | interviewing | offer | rejected`.
_Added 2026-03-09_

### POST Request

```json
{
  "companyId": "uuid | null",
  "jobTitle": "string",
  "jobPostingUrl": "string | null",
  "postingStatus": "active | closed | filled | unknown",
  "location": "string | null",
  "salaryMin": "integer | null",
  "salaryMax": "integer | null",
  "salaryPeriod": "yearly | hourly",
  "status": "saved | applied | interviewing | offered | rejected",
  "appliedAt": "timestamptz | null",
  "source": "string | null",
  "resumeId": "uuid | null"
}
```

~~**status**: "saved | applied | interviewing | offered | rejected | withdrawn"~~
**status** (implemented): `saved | applied | interviewing | offer | rejected.
_Amended 2026-03-09_

### PATCH Request

All fields optional — only send what is changing:

```json
{
  "jobTitle": "string",
  "jobPostingUrl": "string | null",
  "postingStatus": "active | closed | filled | unknown",
  "status": "saved | applied | interviewing | offered | rejected",
  "salaryMin": "integer | null",
  "salaryMax": "integer | null",
  "salaryPeriod": "yearly | hourly | null"
}
```

**Salary:** Stored in cents. When `salaryPeriod` is `yearly`, values are cents per year; when `hourly`, cents per hour. Optional on create/update; default `yearly`. Display: yearly e.g. "$145,600 – $156,000", hourly e.g. "$75.00 – $85.00 /hr".

**Implemented:** Same status union as POST. All fields optional — only send what is changing. Status union same as POST.
_Amended 2026-03-09_

### POST /applications/:id/check-posting Response

```json
{
  "data": {
    "postingStatus": "active | closed | filled | unknown",
    "postingStatusCheckedAt": "timestamptz"
  }
}
```

---

## Interviews

| Method | Route                                            | Description                     |
| ------ | ------------------------------------------------ | ------------------------------- |
| GET    | `/api/v1/applications/:applicationId/interviews` | List interviews for application |
| POST   | `/api/v1/applications/:applicationId/interviews` | Add interview to application    |
| GET    | `/api/v1/interviews/:id`                         | Get interview                   |
| PATCH  | `/api/v1/interviews/:id`                         | Update interview                |
| DELETE | `/api/v1/interviews/:id`                         | Delete interview                |

**Note:** Double ownership validation on nested routes — both parent application and interview verified.

### POST Request

```json
{
  "interviewType": "phone | technical | behavioral | onsite | final",
  "scheduledAt": "timestamptz | null",
  "interviewerName": "string | null",
  "interviewerTitle": "string | null",
  "outcome": "pending | passed | failed | no_show"
}
```

---

## Notes

| Method | Route               | Description                |
| ------ | ------------------- | -------------------------- |
| GET    | `/api/v1/notes`     | List all notes — paginated |
| POST   | `/api/v1/notes`     | Create a note              |
| GET    | `/api/v1/notes/:id` | Get a note                 |
| PATCH  | `/api/v1/notes/:id` | Update note                |
| DELETE | `/api/v1/notes/:id` | Delete note                |

**Query params:** `?page=1&limit=20&typeTag=interview&applicationId=uuid&interviewId=uuid&companyId=uuid`

**Note:** Relational tag IDs validated to belong to authenticated user. Only one relational tag accepted per note — ValidationError if more than one provided.

### POST Request

```json
{
  "content": "string",
  "typeTag": "interview | job_description | research | general",
  "applicationId": "uuid | null",
  "interviewId": "uuid | null",
  "companyId": "uuid | null"
}
```

---

## Resumes

| Method | Route                         | Description                              |
| ------ | ----------------------------- | ---------------------------------------- |
| GET    | `/api/v1/resumes`             | List resumes — paginated                 |
| POST   | `/api/v1/resumes`             | Upload resume — limit 5 per user         |
| GET    | `/api/v1/resumes/:id`         | Get resume metadata and signed URL       |
| GET    | `/api/v1/resumes/:id/preview` | Stream PDF for inline preview (PDF only) |
| PATCH  | `/api/v1/resumes/:id`         | Set resume as active                     |
| DELETE | `/api/v1/resumes/:id`         | Delete from R2 and database              |

**Query params (list):** `?page=1&limit=20` (limit max 100). Response: `{ items, page, limit, total }`.

**Note:** R2/S3 key never returned. Signed URLs expire in 15 minutes; generated with ResponseContentDisposition: inline for preview. DELETE removes from R2 first, then database. GET /:id/preview returns 400 for non-PDF; response is streamed with Content-Disposition: inline, X-Frame-Options: SAMEORIGIN.

### POST Request

```
Content-Type: multipart/form-data
file: <PDF or DOCX>
```

### GET /:id Response

```json
{
  "data": {
    "id": "uuid",
    "fileName": "string",
    "fileType": "pdf | docx",
    "fileSizeBytes": "integer",
    "isActive": "boolean",
    "signedUrl": "string",
    "createdAt": "timestamptz"
  }
}
```

---

## Notifications

| Method | Route                            | Description                    |
| ------ | -------------------------------- | ------------------------------ |
| GET    | `/api/v1/notifications`          | List notifications — paginated |
| PATCH  | `/api/v1/notifications/:id`      | Mark as read                   |
| PATCH  | `/api/v1/notifications/read-all` | Mark all as read               |
| DELETE | `/api/v1/notifications/:id`      | Delete notification            |
| DELETE | `/api/v1/notifications`          | Clear all notifications        |

**Note:** Notifications created server-side only. Bulk operations scoped to authenticated user only.

---

## Dashboard

| Method | Route                       | Description           |
| ------ | --------------------------- | --------------------- |
| GET    | `/api/v1/dashboard/metrics` | Get dashboard metrics |

**Note:** Redis cache key includes `user_id` — never share cached metrics between users. Cache invalidated on application or interview changes.

### Response

Implemented. Status keys match current application status set (saved, applied, interviewing, offer, rejected).

```json
{
  "data": {
    "totalApplications": "integer",
    "applicationsByStatus": {
      "saved": "integer",
      "applied": "integer",
      "interviewing": "integer",
      "offer": "integer",
      "rejected": "integer"
    },
    "interviewRate": "float",
    "activeApplications": "integer",
    "offersReceived": "integer",
    "rejectionsReceived": "integer"
  }
}
```

---

## Webhooks (Reserved; not implemented)

| Method | Route                           | Description            | Auth              |
| ------ | ------------------------------- | ---------------------- | ----------------- |
| POST   | `/api/v1/webhooks/applications` | Receive job board data | Webhook signature |

**Note:** Signature validated before any processing. Malformed or unverified payloads rejected with 401. All incoming data validated with Zod before touching the database.
