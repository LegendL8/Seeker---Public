# Seeker — Architecture Documentation

> Items marked `[IMPL]` are flagged for decision at implementation time.

---

## Project Overview

Seeker is a job seeker-facing Applicant Tracking System (ATS) that flips the traditional model —
giving job seekers their own dashboard to track applications, interviews, notes, and metrics.

---

## Layer 1: Core Tech Stack

| Category         | Decision                                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| Framework        | Next.js (full-stack)                                                                                            |
| Language         | TypeScript (all layers)                                                                                         |
| Runtime          | Node.js 20 LTS                                                                                                  |
| Backend          | Express.js                                                                                                      |
| Database         | PostgreSQL (normalized schema)                                                                                  |
| Caching          | Redis                                                                                                           |
| Package Manager  | NPM                                                                                                             |
| Module System    | ES Modules (`"type": "module"` in package.json)                                                                 |
| TS Module Target | `"module": "ESNext"`, `"target": "ES2022"`                                                                      |
| Strict Mode      | TypeScript strict mode ON                                                                                       |
| Enums            | No TypeScript enums — use union types instead                                                                   |
| Any Types        | Strictly forbidden — no `any`                                                                                   |
| API Typing       | Manual TypeScript interfaces                                                                                    |
| Build Tool       | Turbopack (built into Next.js)                                                                                  |
| UI State         | Zustand                                                                                                         |
| Server State     | TanStack Query                                                                                                  |
| ORM              | Drizzle                                                                                                         |
| Validation       | Zod (forms, API input, and env vars)                                                                            |
| Logging          | Pino + pino-http                                                                                                |
| Error Structure  | Custom error classes (extend native Error)                                                                      |
| Styling          | Pure CSS — CSS Modules, BEM, CSS Custom Properties (shared tokens in `globals.css`; see Frontend styling below) |
| Dependencies     | Minimal — prefer built-ins over libraries                                                                       |

### Flagged for Implementation

- Path aliases: implemented — `@/*` -> `./src/*` in `tsconfig.json`
- Error handling and server auth typing implemented (see Error Handling section above).
  _Added 2026-03-09_
- `[IMPL]` Absolute vs relative imports for server code
- `[IMPL]` Specific `tsconfig.json` settings beyond strict and target

---

## Layer 2: Third-Party Services

| Service       | Purpose                                  |
| ------------- | ---------------------------------------- |
| Auth0         | Authentication                           |
| Cloudflare R2 | File storage — PDF & DOCX resume uploads |
| Redis Cloud   | Caching                                  |
| OpenAI        | AI integration (future — not in MVP)     |

### Future Considerations

- AWS CloudWatch for logging and observability (post-MVP)

---

## Layer 3: Architecture & Patterns

### API Design

- REST APIs for all CRUD operations
- Webhooks for incoming external data (job board integrations)
- API versioning: all endpoints prefixed with `/api/v1/`
- Pagination: offset-based — `?page=1&limit=20`. List endpoints may also support cursor-based pagination (`cursor` + `limit`, response includes `nextCursor`) for O(k) select cost; applications list supports both.

### Authentication Flow

- Auth0 handles login and token issuance
- JWT access tokens for API authorization
- Refresh tokens stored in httpOnly cookies (XSS protection)
- Frontend automatically refreshes access tokens before expiration
- Backend verifies JWT signature only — no session storage
- Optional in-process user cache: short-TTL cache keyed by JWT sub in requireAuth; cache hit avoids DB user lookup (O(1)). TTL e.g. 60s. On miss, DB lookup and cache set.

**Next.js (App Router) session gate:** `src/middleware.ts` requires a session for all routes except **`/`** (logged-out entry) and **`/auth/*`** (Auth0 SDK routes plus app-owned auth pages). Unauthenticated visitors to a protected URL are redirected to **`/auth/sign-in?returnTo=<path+search>`** (`returnTo` preserves query string). That page shows short copy and sends the user to **`/auth/login?returnTo=...`** (SDK), which starts the Auth0 authorize redirect. After a successful OAuth callback, **`Auth0Client` `onCallback`** in `src/lib/auth0.ts` redirects to the transaction’s `returnTo` using the same URL resolution rules as the SDK (including `NEXT_PUBLIC_BASE_PATH` when set); helpers live in `src/lib/authReturnTo.ts` (`sanitizeReturnTo`, `createAppPathRedirectUrl`). On callback **failure**, `onCallback` redirects to **`/auth/error?code=...`** (optional `returnTo` for “Try again”) with user-facing copy; if **`APP_BASE_URL`** cannot be resolved, a minimal HTML response with relative links is returned instead of a bare 500. Logout remains **`/auth/logout`** (SDK); post-logout landing is governed by Auth0 **Allowed Logout URLs** (typically the app origin).
_Added 2026-03-19_

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
- Files stored securely in Cloudflare R2

### Security Headers

- HSTS — HTTPS enforcement (Express; production only)
- X-Frame-Options: DENY (Express)
- X-Content-Type-Options: nosniff (Express)
- Referrer-Policy: no-referrer (Express)
- Content Security Policy (CSP) — set in Next.js on document responses; allows 'self' and Auth0 (\*.auth0.com); script/style use 'unsafe-inline' for Next.js and Auth0 SDK; frame-ancestors 'none'. Exception: `/api/proxy/v1/resumes/:id/preview` gets `frame-ancestors 'self'` only so the PDF preview iframe can embed. Source: next.config.ts headers.
- Permissions-Policy — set in Next.js; camera, microphone, geolocation, payment, usb, magnetometer, gyroscope, accelerometer disabled.

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

Applications feature implemented: `server/applications/` (types.ts, service.ts, routes.ts). List/Get/Create/Update/Delete with offset pagination and Zod validation. Salary: `salary_min`/`salary_max` stored in cents; `salary_period` (`yearly` | `hourly`) indicates unit. Frontend form accepts yearly (e.g. "150,000") or hourly (e.g. "$75.00"); list and detail display with period (e.g. "$145,600 – $156,000" or "$75.00 – $85.00 /hr"). Applications list uses wider content area (main max-width 1100px) so row fits. Frontend: `src/features/applications/` (list, detail, add form, edit form, delete with confirm); routes `/applications`, `/applications/new`, `/applications/[id]`, `/applications/[id]/edit`.
_Updated 2026-03-09_
_Updated 2026-03-19_

Interviews: `server/interviews/` (types.ts, service.ts, routes.ts). Nested under applications: GET/POST `/api/v1/applications/:applicationId/interviews`. Standalone: GET/PATCH/DELETE `/api/v1/interviews/:id`. PATCH no-op returns first-fetched row (one read). Frontend: `src/features/interviews/` (InterviewList, AddInterviewForm on application detail). Application detail page prefetches interviews in parallel (ApplicationDetail calls useInterviewsForApplication(id) at top level with route id).
_Added 2026-03-10_
_Updated 2026-03-13_

Notes: `server/notes/` (types.ts, service.ts, routes.ts). GET list (paginated, filter by typeTag, applicationId, interviewId, companyId), GET/POST/PATCH/DELETE `/api/v1/notes` and `/api/v1/notes/:id`. At most one relational tag per note (enforced in schema and service). PATCH no-op returns first-fetched row (one read). Frontend: `src/features/notes/` (NotesList at `/notes`, AddNoteForm, NoteEditor with debounced save). List empty state is shown only after list data has loaded (`data != null && total === 0`) to avoid a flash on refresh.
_Added 2026-03-10_
_Updated 2026-03-17_

Dashboard: `server/dashboard/` (types.ts, cache.ts, service.ts, routes.ts). GET `/api/v1/dashboard/metrics` returns totalApplications, applicationsByStatus (saved, applied, interviewing, offer, rejected), interviewRate, activeApplications, offersReceived, rejectionsReceived. Redis cache per user (60s TTL); invalidated on application or interview create/update/delete. Frontend: `src/features/dashboard/` (Dashboard at `/` when authenticated, useDashboardMetrics, fetchDashboardMetrics).
_Added 2026-03-10_

Resumes list: GET `/api/v1/resumes` accepts `?page=1&limit=20` (limit max 100), returns `{ items, page, limit, total }`. GET `/api/v1/resumes/:id/preview` streams PDF for inline preview (PDF only; 400 for DOCX). Upload limit: RESUME*CAP per user (server/resumes/types.ts; frontend matches). Frontend: `useResumesList(page, limit)`, ResumesList with pagination UI; PDF preview in modal iframe, DOCX via signed URL in new tab. setActiveResume: one conditional update when setting active (SET is_active = (id = :id) WHERE user_id); one update when inactive; no separate read or bulk step.
\_Added 2026-03-13\*
\_Updated 2026-03-19*

### Frontend styling (authenticated light content area)

- Main column background uses `var(--light-bg)` (`src/app/layout.module.css`). Shared light-surface tokens are defined on `:root` in `src/app/globals.css` (e.g. `--light-text`, `--light-text-muted`, `--light-surface`, `--light-surface-hover`, `--light-border`, `--light-error`, `--light-shadow-card`, `--radius-sm` / `--radius-md` / `--radius-xs` / `--radius-pill`). Feature `*.module.css` files reference these for borders, text, inputs, cards, and controls in the light main area. Earlier `:root` entries (dark background/foreground) remain for document-level defaults; the sidebar (NavBar) keeps its own module styles.
  _Added 2026-03-18_
- Responsive layout: CSS Modules use `@media` at **900px** (app shell + NavBar), **768px** (main list views, dashboard, page shells, auth sign-in/error), **769–1024px** (applications list tablet row scroll), and **640px** (several forms and application detail). Notes add form and note editor use **640px** for larger tap targets and full-width primary actions where relevant; auth error page stacks action links full width at **768px**.
  _Added 2026-03-19_

### Implementation Notes

- `[IMPL]` Resolve remaining documentation inconsistencies. (1) Application status — API.md POST/PATCH body examples and SCHEMA.md applications table show "offered" and "withdrawn"; implementation uses "offer" and has no "withdrawn". Align docs to current behavior or implement missing values. (2) SCHEMA.md Seed Files — seed.active.ts inserts 6 applications and 4 interviews; SCHEMA.md says "10 applications" and "5 interviews". Correct counts.
- PDF preview (resolved): GET `/api/v1/resumes/:id/preview` streams PDF with Content-Disposition: inline, X-Frame-Options: SAMEORIGIN, and frame-ancestors 'self'. Frontend loads same-origin via proxy (`/api/proxy/v1/resumes/:id/preview`) in a modal iframe. Next.js CSP excludes that path from frame-ancestors 'none' so the iframe can embed. DOCX preview opens signed URL (inline disposition) in new tab.

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
| Secrets Manager           | API keys & credentials         |
| Application Load Balancer | Traffic distribution & scaling |
| AWS Certificate Manager   | SSL certificates (auto-renews) |

File storage is provided by Cloudflare R2 (not AWS).

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
- Jest configured; roots: `server/` and `src/`. Server and frontend test files named `0001nameoffeature.test.ts` (see DOCUMENTATION/DEVELOPMENT.md). Server: errors, asyncHandler, config, applications validation/service (including listApplicationsByCursor and cursor in list query), interviews validation/service, notes validation/service, rate limit, dashboard service (0011)/cache (0012)/routes (0013), resumes validation (0016)/service (0014), security headers and CORS (0015). Frontend: getApiBaseUrl (src/lib), applications form schema and API client, interviews API client, notes API client, dashboard API client, resumes API client (0001resumesApi). Edge cases: cache hit/miss, empty data, invalid JSON in cache, 401 when unauthenticated, list empty results, validation bounds (limit, page, invalid UUIDs). Route-level tests for applications, interviews, notes, and resumes and auth middleware (requireAuth) tests are deferred until refactor or pre-release need.
  _Updated 2026-03-13_

### Flagged for Implementation

- `[IMPL]` Local dev workflow scripts
- `[IMPL]` Git branching strategy
- `[IMPL]` VS Code workspace settings and extensions
- `[IMPL]` `launch.json` debugger configuration
