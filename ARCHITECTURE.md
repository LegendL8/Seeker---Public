# Seeker — Architecture Documentation

> Items marked `[IMPL]` are flagged for decision at implementation time.

---

## Project Overview

Seeker is a job seeker-facing Applicant Tracking System (ATS) that flips the traditional model —
giving job seekers their own dashboard to track applications, interviews, notes, and metrics.

---

## Layer 1: Core Tech Stack

| Category         | Decision                                           |
| ---------------- | -------------------------------------------------- |
| Framework        | Next.js (full-stack)                               |
| Language         | TypeScript (all layers)                            |
| Runtime          | Node.js 20 LTS                                     |
| Backend          | Express.js                                         |
| Database         | PostgreSQL (normalized schema)                     |
| Caching          | Redis                                              |
| Package Manager  | NPM                                                |
| Module System    | ES Modules (`"type": "module"` in package.json)    |
| TS Module Target | `"module": "ESNext"`, `"target": "ES2022"`         |
| Strict Mode      | TypeScript strict mode ON                          |
| Enums            | No TypeScript enums — use union types instead      |
| Any Types        | Strictly forbidden — no `any`                      |
| API Typing       | Manual TypeScript interfaces                       |
| Build Tool       | Turbopack (built into Next.js)                     |
| UI State         | Zustand                                            |
| Server State     | TanStack Query                                     |
| ORM              | Drizzle                                            |
| Validation       | Zod (forms, API input, and env vars)               |
| Logging          | Pino + pino-http                                   |
| Error Structure  | Custom error classes (extend native Error)         |
| Styling          | Pure CSS — CSS Modules, BEM, CSS Custom Properties |
| Dependencies     | Minimal — prefer built-ins over libraries          |

### Flagged for Implementation

- Path aliases: implemented — `@/*` -> `./src/*` in `tsconfig.json`
- Error handling and server auth typing implemented (see Error Handling section above).
  _Added 2026-03-09_
- `[IMPL]` Absolute vs relative imports for server code
- `[IMPL]` Specific `tsconfig.json` settings beyond strict and target

---

## Layer 2: Third-Party Services

| Service     | Purpose                                  |
| ----------- | ---------------------------------------- |
| Auth0       | Authentication                           |
| AWS S3      | File storage — PDF & DOCX resume uploads |
| Redis Cloud | Caching                                  |
| OpenAI      | AI integration (future — not in MVP)     |

### Future Considerations

- AWS CloudWatch for logging and observability (post-MVP)

---

## Layer 3: Architecture & Patterns

### API Design

- REST APIs for all CRUD operations
- Webhooks for incoming external data (job board integrations)
- API versioning: all endpoints prefixed with `/api/v1/`
- Pagination: offset-based — `?page=1&limit=20`

### Authentication Flow

- Auth0 handles login and token issuance
- JWT access tokens for API authorization
- Refresh tokens stored in httpOnly cookies (XSS protection)
- Frontend automatically refreshes access tokens before expiration
- Backend verifies JWT signature only — no session storage

### Authorization

- All users have access to all features. No tier restrictions.

### Data Updates

- Server-confirmed updates only — UI updates only after server responds successfully
- No optimistic updates
- TanStack Query built-in refetching for frontend real-time updates
- No WebSockets at this scale

### Caching Strategy

- Redis caches all dashboard and metric data
- Protects PostgreSQL from repeated refresh requests
- Debounced note saves on frontend to reduce API call frequency

### Error Handling

- Custom error classes extending native `Error`
- Examples: `AppError`, `ValidationError`, `NotFoundError`, `AuthError`
- Standardized error response format:

```json
{ "error": "CODE", "message": "Description", "statusCode": 400 }
```

- All errors logged via Pino
- Implemented: `server/errors.ts` (classes + central errorHandler), `server/asyncHandler.ts`; Express `Request` extended with optional `user` via `server/express.d.ts`; server loads `.env` via dotenv at startup.
  _Added 2026-03-09_

### Rate Limiting

- Global rate limiting as a safety net
- Stricter per-endpoint limits on sensitive routes (login, token refresh)
- Implemented: express-rate-limit; global 100 req/min per IP on `/api`; applications routes 60 req/min per user (server/rateLimit.ts). 429 response uses standard error format.
  _Added 2026-03-09_

### Input Validation & Sanitization

- Zod for all form and API input validation (frontend + backend)
- File type validation — PDF and DOCX only
- Files stored securely in AWS S3

### Security Headers

- HSTS — HTTPS enforcement
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: no-referrer
- `[IMPL]` Content Security Policy (CSP)
- `[IMPL]` Permissions-Policy

### CORS

- Strict — own domain only, no exceptions

### Database

- PostgreSQL with normalized schema
- Core entities: Users, Applications, Companies, Interviews, Notes
- Relational foreign keys between entities
- Drizzle Kit for migration generation — migrations run manually as deliberate deployment step

### Codebase Structure

- Monolithic architecture — designed to accept microservices via API/webhooks later
- Feature-based organization:

```
/
├── src/                        # Next.js frontend
│   ├── applications/
│   ├── interviews/
│   ├── dashboard/
│   └── [feature]/
│       ├── components/
│       ├── hooks/
│       └── utils/
├── server/                     # Express backend
│   ├── applications/
│   ├── interviews/
│   └── [feature]/
│       ├── routes/
│       ├── services/
│       └── webhooks/
└── [root config files]
```

Applications feature implemented: `server/applications/` (types.ts, service.ts, routes.ts). List/Get/Create/Update/Delete with offset pagination and Zod validation. Frontend: `src/features/applications/` (list, detail, add form, edit form, delete with confirm); routes `/applications`, `/applications/new`, `/applications/[id]`, `/applications/[id]/edit`.
_Updated 2026-03-09_
_Added 2026-03-09_

Interviews: `server/interviews/` (types.ts, service.ts, routes.ts). Nested under applications: GET/POST `/api/v1/applications/:applicationId/interviews`. Standalone: GET/PATCH/DELETE `/api/v1/interviews/:id`. Frontend: `src/features/interviews/` (InterviewList, AddInterviewForm on application detail).
_Added 2026-03-10_

Notes: `server/notes/` (types.ts, service.ts, routes.ts). GET list (paginated, filter by typeTag, applicationId, interviewId, companyId), GET/POST/PATCH/DELETE `/api/v1/notes` and `/api/v1/notes/:id`. At most one relational tag per note (enforced in schema and service). Frontend: `src/features/notes/` (NotesList at `/notes`, AddNoteForm, NoteEditor with debounced save).
_Added 2026-03-10_

Dashboard: `server/dashboard/` (types.ts, cache.ts, service.ts, routes.ts). GET `/api/v1/dashboard/metrics` returns totalApplications, applicationsByStatus (saved, applied, interviewing, offer, rejected), interviewRate, activeApplications, offersReceived, rejectionsReceived. Redis cache per user (60s TTL); invalidated on application or interview create/update/delete. Frontend: `src/features/dashboard/` (Dashboard at `/` when authenticated, useDashboardMetrics, fetchDashboardMetrics).
_Added 2026-03-10_

### Implementation Notes

- `[IMPL]` Resolve remaining documentation inconsistencies. (1) Application status — API.md POST/PATCH body examples and SCHEMA.md applications table show "offered" and "withdrawn"; implementation uses "offer" and has no "withdrawn". Align docs to current behavior or implement missing values. (2) SCHEMA.md Seed Files — seed.active.ts inserts 6 applications and 4 interviews; SCHEMA.md says "10 applications" and "5 interviews". Correct counts.
- `[IMPL]` PDF preview iframe issue — related to X-Frame-Options and S3 header
  configuration. Previous ATS had this bug. S3 must serve PDFs with headers
  allowing embedding within own domain only. Do not repeat this mistake.

---

## Layer 4: Deployment & Infrastructure

### Environments

| Environment | Platform                  |
| ----------- | ------------------------- |
| Development | Proxmox (self-hosted)     |
| Testing     | Isolated test environment |
| Staging     | Mirrors production        |
| Production  | AWS                       |

Each environment has its own `.env` file. Staging and production secrets managed via AWS Secrets Manager.

### AWS Production Infrastructure

| Service                   | Purpose                        |
| ------------------------- | ------------------------------ |
| EC2                       | App hosting                    |
| RDS                       | PostgreSQL database            |
| S3                        | File storage                   |
| Secrets Manager           | API keys & credentials         |
| Application Load Balancer | Traffic distribution & scaling |
| AWS Certificate Manager   | SSL certificates (auto-renews) |

### Containerization

- Docker with Docker Compose — multiple containers
- Containers: Next.js, Express, Redis, PostgreSQL (dev only)
- Production uses AWS RDS and Redis Cloud — no database containers in prod

### SSL

- Self-signed certificates for local development
- AWS Certificate Manager for production — integrated with ALB

### Database (Development)

- Drizzle seed files for recreating development database
- Multiple seed files for different app states:
  - `seed.fresh.ts` — New user with no data
  - `seed.active.ts` — User mid job search; run with `npm run db:seed:active`. Requires `SEED_ACTIVE_AUTH0_ID` (Auth0 user id / sub). If that user does not exist in the DB yet, also set `SEED_ACTIVE_EMAIL`. Example: `SEED_ACTIVE_AUTH0_ID='auth0|xxx' SEED_ACTIVE_EMAIL=you@example.com npm run db:seed:active`
  - `seed.demo.ts` — Full realistic sample dataset

### Repository Strategy

- **Single open source repo** — all features live in one public repository
- Community can clone, self-host, and run the full product
- No private repo, no submodules, no proprietary code split
- Monetization (e.g. hosted service, support) is separate from code visibility; all feature code is public

### Post-Milestone 4 — Public Launch

- Clean up repo for public release — remove dev artifacts, README and LICENSE in place
- Publish current repo as the public open source project
- Milestone 5 and beyond developed in this repo; all features remain open source

### Flagged for Implementation

- `[IMPL]` GitHub Actions CI/CD pipeline
- `[IMPL]` NGINX configuration on EC2
- `[IMPL]` DNS and domain name
- `[IMPL]` Staging and production backup strategy
- `[IMPL]` AWS CloudWatch logging

---

## Layer 5: Development Tools & Workflows

| Tool                   | Purpose                                 |
| ---------------------- | --------------------------------------- |
| ESLint                 | Linting                                 |
| Prettier               | Code formatting                         |
| eslint-config-prettier | Prevents ESLint/Prettier rule conflicts |
| Jest                   | Unit & integration testing              |
| Playwright             | End-to-end testing                      |
| Pino + pino-http       | HTTP and application logging            |
| Swagger                | Interactive API docs at `/docs`         |
| VS Code / Cursor       | IDE                                     |
| VS Code Debugger       | Breakpoint debugging via `launch.json`  |
| Insomnia               | API testing during development          |

### Testing Strategy

- Unit tests — individual functions and components
- Integration tests — API and service layer
- End-to-end tests — full user flows via Playwright
- ~~Jest configured; server test files named `0001nameoffeature.test.ts` (see DOCUMENTATION/DEVELOPMENT.md). Tests: errors, asyncHandler, config schema, applications validation/service, rate limit handler.~~
- Jest configured; roots: `server/` and `src/`. Server and frontend test files named `0001nameoffeature.test.ts` (see DOCUMENTATION/DEVELOPMENT.md). Server: errors, asyncHandler, config, applications validation/service, interviews validation/service, notes validation/service, rate limit, dashboard service (0011), dashboard cache (0012), dashboard routes (0013). Frontend: getApiBaseUrl (src/lib), applications form schema and API client, interviews API client, notes API client, dashboard API client (0001dashboardApi). Edge cases: cache hit/miss, empty data, invalid JSON in cache, 401 when unauthenticated, list empty results, validation bounds (limit, page, invalid UUIDs).
  _Updated 2026-03-10_

### Flagged for Implementation

- `[IMPL]` Local dev workflow scripts
- `[IMPL]` Git branching strategy
- `[IMPL]` VS Code workspace settings and extensions
- `[IMPL]` `launch.json` debugger configuration
