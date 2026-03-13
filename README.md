# Seeker

Applicant tracking for job seekers. Track your own applications, companies, interviews, notes, and pipeline from one dashboard.

---

## Prerequisites

- **Node.js** 20 LTS
- **Docker** (Postgres and Redis)
- **Auth0** account. See [DOCUMENTATION/AUTH0.md](DOCUMENTATION/AUTH0.md) for setup.

---

## Running locally

1. Copy environment variables and configure Auth0 (see [DOCUMENTATION/AUTH0.md](DOCUMENTATION/AUTH0.md)):

   ```bash
   cp .env.example .env.local   # Next.js
   # Edit .env (or .env.local) with your Auth0 and database values.
   ```

2. Start Postgres and Redis:

   ```bash
   docker compose up -d postgres redis
   ```

3. Run the app (two processes):

   ```bash
   npm run dev          # Next.js at http://localhost:3000
   npm run dev:server   # Express API at http://localhost:3001 (separate terminal)
   ```

4. Optional: seed the database
   - New user, no data: `npm run db:seed:fresh`
   - Active job search sample: `npm run db:seed:active` (requires `SEED_ACTIVE_AUTH0_ID`; see [ARCHITECTURE.md](ARCHITECTURE.md) Layer 4 Database)
   - Full sample dataset: `npm run db:seed:demo`

5. Run tests: `npm run test`

---

## Stack

| Layer    | Choice                   |
| -------- | ------------------------ |
| Language | TypeScript               |
| Runtime  | Node.js                  |
| UI       | React (Next.js)          |
| API      | Express                  |
| Database | PostgreSQL (Drizzle ORM) |
| Cache    | Redis                    |
| Auth     | Auth0 (JWT)              |

---

## Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** — Source of truth for stack, patterns, and structure.
- **DOCUMENTATION/** — [DOCKER.md](DOCUMENTATION/DOCKER.md), [AUTH0.md](DOCUMENTATION/AUTH0.md), [DEVELOPMENT.md](DOCUMENTATION/DEVELOPMENT.md), [ROADMAP.md](DOCUMENTATION/ROADMAP.md), [API.md](DOCUMENTATION/API.md), [SCHEMA.md](DOCUMENTATION/SCHEMA.md), [FEATURES.md](DOCUMENTATION/FEATURES.md).
