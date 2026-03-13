# Development Process

Short reference for how we work on this project. Details are in the project rules and ARCHITECTURE.md.

---

## Environment

- **Next.js:** Loads `.env`, `.env.local`, etc. automatically. Use `.env.local` for local secrets (not committed).
- **Express server:** Loads `.env` from the project root when you run `npm run dev:server` (via dotenv). So the same `.env` or `.env.local` can supply `AUTH0_ISSUER_BASE_URL`, `AUTH0_AUDIENCE`, `DATABASE_URL`, etc. Do not commit `.env`; copy from `.env.example` and fill in values.

---

## Tests

- Tests are written only when explicitly requested (e.g. "Generate tests").
- Jest for unit and integration tests; Playwright for e2e. Tests live alongside the feature they cover.
- Jest runs from both `server/` and `src/`. Frontend unit tests (e.g. API helper, form schemas, API client) live under `src/` with the same naming convention (`0001nameoffeature.test.ts`).
  _Added 2026-03-09_

---

## Documentation

- ARCHITECTURE.md, ROADMAP.md, and API docs are updated only after the user says "Update the docs" and only for completed, tested work.
- Do not update documentation during active development. When a feature is done and tests pass, suggest what to update and then update only after the user confirms.
