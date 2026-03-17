# Docker Usage

Four services: Next.js, Express, PostgreSQL, Redis. The API server connects to Postgres and Redis (dashboard cache). Next and server load `.env` via `env_file` for Auth0 and other config; compose overrides `DATABASE_URL`, `REDIS_URL`, and `EXPRESS_API_URL` for in-container networking.

---

## How to start the program

**First time or after `docker compose down -v`:**

```bash
docker compose up -d postgres redis
docker compose run --rm server npm run db:migrate
docker compose up
```

Then open http://localhost:3000.

**Normal start** (DB already exists):

```bash
docker compose up
```

**App on host, DB in Docker:**

```bash
docker compose up -d postgres redis
docker compose run --rm server npm run db:migrate
npm run dev
npm run dev:server
```

Use a `.env` with `DATABASE_URL` and `REDIS_URL` pointing at localhost and the same ports as the Postgres/Redis service mappings in `docker-compose.yml`. If port 5432 is in use on the host, change the Postgres port in `docker-compose.yml` (e.g. `"5433:5432"`) and set `DATABASE_URL` to use that host port.

---

## Prerequisites

- Docker and Docker Compose installed
- No other process using ports 3000, 3001, 5432, or 6379 (stop any local `npm run dev` or `npm run dev:server` first)
- A `.env` file in the project root with Auth0 and other vars (see `.env.example`). Next and server containers use it via `env_file`; compose overrides only the URLs that must point at container hostnames.

---

## Run the full stack

```bash
docker compose up -d
```

- **Next.js:** http://localhost:3000
- **API (Express):** http://localhost:3001 (e.g. GET http://localhost:3001/api/v1/health)
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

Build runs on first `up` or when the Dockerfile or compose file changes.

---

## Run only PostgreSQL and Redis

When you run Next and Express on the host:

```bash
docker compose up -d postgres redis
```

Then: `npm run dev` (Next on 3000), `npm run dev:server` (Express on 3001). Use the connection details below for `.env` when connecting from the host.

---

## Run migrations (Docker Postgres)

If `npm run db:migrate` from the host fails with a role or connection error, you may be hitting a different Postgres than the one in Docker. Run migrations inside the app container instead:

```bash
docker compose run --rm server npm run db:migrate
```

---

## Environment variables

Copy `.env.example` to `.env` and fill in Auth0, etc. Set `POSTGRES_PASSWORD` (required for Docker Compose; no default is committed). Optionally set `POSTGRES_USER` and `POSTGRES_DB` (defaults: seeker). Next and server services use `env_file: .env`; the compose `environment` block overrides `PORT`, `DATABASE_URL`, `REDIS_URL`, and `EXPRESS_API_URL` so the stack works inside the network. Do not commit `.env`.

---

## Connection details (host → Docker)

When the app runs on the host and Postgres/Redis are in Docker, use the same user/password/database and ports as in your `.env` (POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB) and `docker-compose.yml` ports. Example shape:

| Service    | Host      | Port | User / Password / Database                                                             |
| ---------- | --------- | ---- | -------------------------------------------------------------------------------------- |
| PostgreSQL | localhost | 5432 | From .env: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB (defaults: seeker, -, seeker) |
| Redis      | localhost | 6379 | (none)                                                                                 |

`DATABASE_URL` format: `postgresql://USER:PASSWORD@localhost:PORT/DATABASE` — use the same USER, PASSWORD, DATABASE as in your `.env`.

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
- 5432: Postgres. If in use (e.g. native Postgres), change the host port in `docker-compose.yml` (e.g. `"5433:5432"`) and set `DATABASE_URL` in `.env` to use that port when running the app on the host.
- 6379: stop any other Redis instance, or change the host port in `docker-compose.yml`.
