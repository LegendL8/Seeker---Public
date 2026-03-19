# Development Process

Short reference for how we work on this project. Details are in the project rules and ARCHITECTURE.md.

---

## Environment

- **Next.js:** Loads `.env`, `.env.local`, etc. automatically. Use `.env.local` for local secrets (not committed).
- **Express server:** Loads `.env` from the project root when you run `npm run dev:server` (via dotenv). So the same `.env` or `.env.local` can supply `AUTH0_ISSUER_BASE_URL`, `AUTH0_AUDIENCE`, `DATABASE_URL`, etc. Do not commit `.env`; copy from `.env.example` and fill in values.

---

## Tests

- Tests are written or extended where coverage is needed.
- Jest for unit and integration tests; Playwright for e2e. Tests live alongside the feature they cover.
- Jest runs from both `server/` and `src/`. Server test files: errors, asyncHandler, config, applications validation/service (including listApplicationsByCursor), interviews validation/service, notes validation/service, rate limit, dashboard service/cache/routes, resumes validation (0016)/service, security (0015). Frontend: getApiBaseUrl (src/lib), applications form schema and API client, interviews API client, notes API client, dashboard API client, resumes API client (0001resumesApi).
- **Deferred:** Route-level tests for applications, interviews, notes, and resumes (beyond the single dashboard route test) and auth middleware (requireAuth) tests are deferred until refactor or pre-release need; service and validation coverage is in place.
  _Updated 2026-03-13_

---
