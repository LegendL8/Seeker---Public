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

| Use case              | Required in Auth0                     | Required in env                       |
| --------------------- | ------------------------------------- | ------------------------------------- |
| Login / logout (Next) | Regular Web App, callback/logout URLs | AUTH0_DOMAIN, CLIENT_ID, SECRET, etc. |
| API (Express)         | API with an identifier (audience)     | AUTH0_ISSUER_BASE_URL, AUTH0_AUDIENCE |

---

## Sign-in UX and `returnTo`

1. **Proxy** (`src/proxy.ts`, Next.js 16+ session gate; deprecated name was `middleware.ts`): If there is no session and the path is not public, redirect to **`/auth/sign-in?returnTo=<path+search>`**. Public routes: **`/`** and anything under **`/auth/`**. The Auth0 SDK is still invoked as **`auth0.middleware(request)`** inside that file.
2. **`/auth/sign-in`**: App page with short copy (“You need to sign in…”, “Signing you in…”) and an automatic forward to **`/auth/login?returnTo=...`** (Auth0 SDK route), which stores `returnTo` in the OAuth transaction and redirects to Auth0.
3. **After callback:** On success, custom **`onCallback`** in `src/lib/auth0.ts` redirects to the stored `returnTo` (defaults to `/` if missing). Values are constrained to same-origin relative paths (aligned with SDK `toSafeRedirect`); shared helpers: `src/lib/authReturnTo.ts` (`sanitizeReturnTo`, `createAppPathRedirectUrl`).
4. **Callback errors:** Failed exchanges redirect to **`/auth/error?code=<sdk_error_code>`** (optional `returnTo`) with clear copy and links (Try again / Home). If `APP_BASE_URL` is unavailable for an absolute redirect, a small HTML fallback is returned.

**Direct `/auth/login`:** Still valid (e.g. deep links from docs); prefer user-facing links through **`/auth/sign-in`** so the interstitial runs first.

**Logout:** **`/auth/logout`** (SDK). Ensure **Allowed Logout URLs** in Auth0 includes your app origin (e.g. `http://localhost:3000` and production URL) so users return to the app after Auth0 logout.
