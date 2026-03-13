# Seeker — Project Roadmap

## Goal

Deliver a functional product as fast as possible. Every milestone builds toward launch.

---

## Milestone 0 — Project Foundation

**Goal:** Working local development environment with nothing broken before a single feature is built.

- [x] Next.js scaffolded with TypeScript, ESLint, Prettier
- [x] Folder structure established (`src/`, `server/`)
- [x] Docker Compose running — Next.js, Express, PostgreSQL, Redis containers
- [x] Drizzle configured and connected to PostgreSQL
- [x] Zod configured for env var validation at startup
- [x] Pino and pino-http configured on Express
- [x] Auth0 account created, application configured
- [x] `.env.example` created; copy to `.env.development` and populate as needed
- [x] ARCHITECTURE.md and .cursorrules in project root
- [x] Base seed file created (`server/db/seeds/seed.fresh.ts`); run with `npm run db:seed:fresh`
- [x] ESLint and Prettier configs finalized — no conflicts
- [x] Project runs locally end to end with no errors

**Milestone 0 complete.** Postgres uses host port 5433 when running in Docker (to avoid conflict with local Postgres on 5432). See DOCUMENTATION/DOCKER.md for run order and env.

---

## Milestone 1 — Authentication

**Goal:** A real user can sign up, log in, and log out using Auth0.

- ~~[ ] Auth0 integrated with Next.js frontend~~
- [x] Auth0 integrated with Next.js frontend
      _Updated 2026-03-09_
- ~~[ ] JWT access tokens issued on login~~
- [x] JWT access tokens issued on login (via Auth0 SDK; JWT for API requires Auth0 API + audience, see DOCUMENTATION/AUTH0.md)
      _Updated 2026-03-09_
- ~~[ ] Refresh tokens stored in httpOnly cookies~~
- [x] Refresh tokens stored in httpOnly cookies (session cookie via Auth0 SDK)
      _Updated 2026-03-09_
- ~~[ ] Automatic token refresh before expiration~~
- [x] Automatic token refresh before expiration (SDK handles on getSession/getAccessToken)
      _Updated 2026-03-09_
- ~~[ ] Backend JWT verification middleware on Express~~
- [x] Backend JWT verification middleware on Express (`server/auth/middleware.ts` requireAuth)
      _Updated 2026-03-09_
- ~~[ ] Protected routes — unauthenticated users redirected to login~~
- [x] Protected routes — unauthenticated users redirected to login (all routes except `/auth/*`; landing/login to be exposed later)
      _Updated 2026-03-09_
- ~~[ ] Basic user profile stored in PostgreSQL on first login~~
- [x] Basic user profile stored in PostgreSQL on first login (ensureUserFromToken in auth middleware; GET /api/v1/me)
      _Updated 2026-03-09_
- ~~[ ] Logout clears tokens and redirects~~
- [x] Logout clears tokens and redirects
      _Updated 2026-03-09_

---

## Milestone 2 — Job Application Tracking

**Goal:** A logged-in user can add, view, update, and delete job applications.

- ~~[ ] Applications database table and Drizzle schema~~
- [x] Applications database table and Drizzle schema (existed; used as-is)
      _Updated 2026-03-09_
- ~~[ ] REST API endpoints — GET, POST, PATCH, DELETE `/api/v1/applications`~~
- [x] REST API endpoints — GET, POST, PATCH, DELETE `/api/v1/applications` (server/applications/routes.ts, offset pagination)
      _Updated 2026-03-09_
- ~~[ ] Application status union type~~
- [x] Application status union type (saved | applied | interviewing | offer | rejected; server/applications/types.ts)
      _Updated 2026-03-09_
- ~~[ ] Add application form with Zod validation~~
- [x] Add application form with Zod validation (src/features/applications/AddApplicationForm.tsx, schemas.ts; POST via proxy)
      _Updated 2026-03-09_
- ~~[ ] Applications list view with pagination~~
- [x] Applications list view with pagination (src/features/applications/ApplicationsList.tsx, /applications page; TanStack Query)
      _Updated 2026-03-09_
- ~~[ ] Application detail view~~
- [x] Application detail view (ApplicationDetail.tsx, /applications/[id]; useApplication, GET by id)
      _Updated 2026-03-09_
- ~~[ ] Edit and delete application~~
- [x] Edit and delete application (EditApplicationForm at /applications/[id]/edit, PATCH; delete with confirm on detail)
      _Updated 2026-03-09_
- ~~[ ] TanStack Query for all data fetching~~
- [x] TanStack Query for all data fetching (QueryClientProvider in app, useApplicationsList, useCreateApplication; BFF proxy at /api/proxy)
      _Updated 2026-03-09_
- ~~[ ] Custom error classes wired up~~
- [x] Custom error classes wired up (Milestone 1; server/errors.ts, central errorHandler)
      _Updated 2026-03-09_
- ~~[ ] Standardized error responses across all endpoints~~
- [x] Standardized error responses across auth and health (Milestone 1; format per ARCHITECTURE)
      _Updated 2026-03-09_
- ~~[ ] Rate limiting on all application endpoints~~
- [x] Rate limiting on all application endpoints (express-rate-limit: global 100/min per IP, applications 60/min per user)
      _Updated 2026-03-09_
- ~~[ ] Seed file updated with sample applications~~
- [x] Seed file updated with sample applications (seed.active.ts: user + 6 applications; npm run db:seed:active)
      _Updated 2026-03-09_

---

## Milestone 3 — Interview Tracking & Notes

**Goal:** A user can log interviews tied to applications and add notes to each.

- [x] Interviews database table and Drizzle schema (existed in initial migration)
      _Updated 2026-03-10_
- [x] Notes database table and Drizzle schema (existed in initial migration)
      _Updated 2026-03-10_
- [x] REST API endpoints for interviews (nested under applications + standalone GET/PATCH/DELETE)
      _Updated 2026-03-10_
- [x] REST API endpoints for notes (list, get, create, update, delete; filter by typeTag and relational ids)
      _Updated 2026-03-10_
- [x] Add interview form (AddInterviewForm on application detail)
      _Updated 2026-03-10_
- [x] Interview type union type (phone | technical | behavioral | onsite | final; server/interviews/types.ts)
      _Updated 2026-03-10_
- [x] Notes tab — standalone notes with type and relational tags (/notes, NotesList, filters)
      _Updated 2026-03-10_
- [x] Notes editor — editable text area with debounced saves (NoteEditor, 500ms debounce)
      _Updated 2026-03-10_
- [x] Interview list tied to application detail view (InterviewList on ApplicationDetail)
      _Updated 2026-03-10_
- [x] Seed file updated with sample interviews and notes (seed.active.ts: 4 interviews, 5 notes)
      _Updated 2026-03-10_

---

## Milestone 4 — Dashboard & Metrics

**Goal:** A user lands on a dashboard showing meaningful metrics about their job search.

- [x] Dashboard page as authenticated home screen
- [x] Metrics: total applications, by status, interview rate, active, offers, rejections
- [x] Redis caching for all dashboard metric queries
- [x] Dashboard refreshes via TanStack Query
- [x] Responsive layout — clean and impressive visually
- [x] Empty state when no data exists

_Milestone 4 complete 2026-03-10_

---

## Post-Milestone 4 — Public Launch

**Goal:** Publish the repository as open source; all features are free.

- [ ] Clean up repo for public release — remove dev artifacts, add README, add LICENSE
- [ ] Publish current repo as the public open source project
- [ ] Community can clone, self-host, and run the full product
- [ ] Milestone 5 and beyond developed in this repo

See ARCHITECTURE.md Layer 4 (Repository Strategy, Post-Milestone 4) for details.

---

## Milestone 5 — Resume Upload

**Goal:** A user can upload a resume and attach it to their profile or an application.

- [ ] AWS S3 bucket configured
- [ ] File upload endpoint — PDF and DOCX only
- [ ] File size limit enforced
- [ ] Resume stored in S3, reference in PostgreSQL
- [ ] Resume attached to user profile
- [ ] Resume preview with correct S3 headers (see ARCHITECTURE.md impl note)
- [ ] Delete resume — removes from S3 and database

---

## Milestone 6 — Polish & Launch Prep

**Goal:** App looks and feels professional and ready for use.

- [ ] CSS polish across all views
- [ ] Loading states on all data fetches
- [ ] Error states on all failed requests
- [ ] Empty states on all list views
- [ ] Form validation error messages visible
- [ ] Responsive layout on common screen sizes
- [ ] Seed file with realistic sample data
- [ ] Auth0 login flow smooth and professional
- [ ] No console errors in browser dev tools
- [ ] No broken UI states during typical flows

---

## Later Milestones

- **Milestone 7** — Swagger API docs live at `/docs`
- **Milestone 8** — Staging environment on AWS
- **Milestone 9** — Production deployment on AWS
- **Milestone 10** — Webhook integrations
- **Milestone 11** — OpenAI integration
- **Milestone 12** — GitHub Actions CI/CD pipeline

---

## Definition of Done (Per Milestone)

1. All features in the milestone working locally
2. All relevant tests pass
3. No TypeScript errors
4. No ESLint errors
5. ARCHITECTURE.md updated to reflect implementation decisions made
