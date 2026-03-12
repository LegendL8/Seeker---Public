# Auth0 Setup

Auth0 handles login, token issuance, and session. This doc covers what you need for the Next.js app and for the Express API.

---

## Next.js (frontend)

- **Application type in Auth0:** Regular Web Application.
- **Allowed Callback URLs:** `http://localhost:3000/auth/callback` (add your production URL when you deploy).
- **Allowed Logout URLs:** `http://localhost:3000` (and production when deployed).
- **Env (e.g. `.env.local`):** `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`, `APP_BASE_URL`.

Copy `.env.example` and fill these. `AUTH0_SECRET` is not from Auth0; generate with `openssl rand -hex 32`.

---

## Express API (JWT verification and GET /api/v1/me)

The API verifies JWTs and, on first request, ensures the user exists in PostgreSQL. For that to work you must use **JWTs** (not opaque tokens).

### 1. Create an API in Auth0

- Dashboard → **Applications** → **APIs** → **Create API**.
- Name (e.g. Seeker API), identifier (e.g. `https://api.yourdomain.com`). The identifier is the **audience**.
- Create.

### 2. Enable the API for your Application

- **Applications** → your Regular Web Application → **Settings** → **APIs**.
- Authorize the API you created (so the app can request access tokens for it).

### 3. Server env

When running the Express server, set:

- **AUTH0_ISSUER_BASE_URL** – Auth0 issuer URL, e.g. `https://YOUR_TENANT.auth0.com` (no trailing path).
- **AUTH0_AUDIENCE** – The API identifier you set in step 1.

The server loads these from the environment. For local dev it also loads from a `.env` file in the project root (see DOCUMENTATION/DEVELOPMENT.md).

### 4. Requesting a token with audience (when calling the API from the app)

When the Next.js app calls the Express API (e.g. GET /api/v1/me), it must send an access token that has this audience. Use the Auth0 SDK’s `getAccessToken({ audience: 'YOUR_AUDIENCE' })` with the same value as `AUTH0_AUDIENCE`. If you don’t request an audience, the token may be opaque and the API will reject it.

---

## Summary

| Use case              | Required in Auth0                    | Required in env                          |
|-----------------------|--------------------------------------|------------------------------------------|
| Login / logout (Next) | Regular Web App, callback/logout URLs| AUTH0_DOMAIN, CLIENT_ID, SECRET, etc.    |
| API (Express)         | API with an identifier (audience)    | AUTH0_ISSUER_BASE_URL, AUTH0_AUDIENCE   |

---

## returnTo after login

When an unauthenticated user hits a protected path, we redirect to `/auth/login?returnTo=<path>`. The Auth0 SDK currently redirects back to `/` after login; it does not yet read `returnTo` to send the user to the original path. This will be addressed when we add the landing page and make the post-login redirect configurable.
