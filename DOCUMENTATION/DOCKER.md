# Docker Usage

Current state: four services (Next.js, Express, PostgreSQL, Redis). The API server connects to Postgres (and will use Redis when dashboard caching is added). Seeds: run `npm run db:seed:fresh` from the project root after Postgres is up and migrated.

---

## Prerequisites

- Docker and Docker Compose installed
- No other process using ports 3000, 3001, 5432, or 6379 (stop any local `npm run dev` or `npm run dev:server` first)

---

## Run the full stack

From the project root:

```bash
docker compose up -d
```

- **Next.js:** http://localhost:3000  
- **API (Express):** http://localhost:3001 (e.g. GET http://localhost:3001/api/v1/health)  
- **PostgreSQL:** localhost:5433 (host port; container uses 5432; use 5433 when connecting from the host)  
- **Redis:** localhost:6379 (not yet used by the app)

Containers start in the background. Build runs on first `up` or when the Dockerfile or compose file changes.

---

## Run only PostgreSQL and Redis

Use this when you run the Next and Express apps on the host (e.g. `npm run dev` and `npm run dev:server`):

```bash
docker compose up -d postgres redis
```

Then run from the project root:

- `npm run dev` (Next on 3000)
- `npm run dev:server` (Express on 3001)

When the app is wired to the database, use the connection details below from the host.

---

## Environment variables

For local development, copy the example file and fill in as needed:

```bash
cp .env.example .env.development
```

Edit `.env.development` with real values. Do not commit it (it is gitignored). The file `.env.example` in the project root lists every variable and when it is used (Auth0 in Milestone 1, Redis in Milestone 4). The API server has defaults for `DATABASE_URL` and `PORT`, so you can run without `.env.development` if Postgres is on port 5433 and you are fine with port 3001.

---

## Connection details (for future use)

When Drizzle and Redis clients are configured, use these values when the app runs on the host and Postgres/Redis are in Docker:

| Service   | Host     | Port | User  | Password | Database |
|----------|----------|------|-------|----------|----------|
| PostgreSQL | localhost | 5433 | ets   | etsdev   | ets      |
| Redis    | localhost | 6379 | (none) | (none)  | (none)   |

Connection URL (PostgreSQL):  
`postgresql://ets:etsdev@localhost:5433/ets`

---

## Stop and remove

Stop all services:

```bash
docker compose down
```

Stop and remove volumes (deletes Postgres and Redis data):

```bash
docker compose down -v
```

---

## Rebuild after code or Dockerfile changes

```bash
docker compose up -d --build
```

---

## Port conflicts

If a service fails to start with "address already in use":

- 3000: stop any local `npm run dev`
- 3001: stop any local `npm run dev:server`
- 5433: Postgres host port (container is 5432). If 5433 is in use, change the first number in `docker-compose.yml` (e.g. `"5434:5432"`) and use that port in DATABASE_URL.
- 6379: stop any other Redis instance, or change the host port in `docker-compose.yml`.
