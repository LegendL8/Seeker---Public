# Seeker — Authorization Flow

Mermaid diagram for the API authorization flow: `requireAuth` middleware, JWT verification, user resolution (cache / DB / provision), and outcome.

```mermaid
flowchart TB
  REQ[Request with Authorization header] --> CHECK{"Bearer token present?"}
  CHECK -->|No| REJECT1[Reject with 401 AuthError]
  CHECK -->|Yes| VERIFY[JWT verify via Auth0 JWKS]
  VERIFY --> VALID{"Valid signature and claims?"}
  VALID -->|No| REJECT2[Reject with 401 Invalid or expired token]
  VALID -->|Yes| SUB[Extract sub from payload]
  SUB --> CACHE{"User in cache?"}
  CACHE -->|Yes| ATTACH1[Attach user to request]
  CACHE -->|No| DB{"User in DB by auth0Id?"}
  DB -->|Yes| LOAD[Load user, set cache]
  LOAD --> ATTACH1
  DB -->|No| PROVISION[Provision user: Auth0 userinfo, insert user and preferences]
  PROVISION --> PROVOK{"Provision OK?"}
  PROVOK -->|No| REJECT3[Reject with 401 Could not create user]
  PROVOK -->|Yes| ATTACH1
  ATTACH1 --> ALLOW[Authorized - next]
```

## Summary

| Step | What happens |
|------|----------------|
| **Request** | Protected route receives `Authorization: Bearer <accessToken>`. |
| **Check** | Missing or non-Bearer header throws AuthError (401). |
| **Verify** | Token verified with Auth0 JWKS (issuer, optional audience). Invalid or expired token throws AuthError (401). |
| **User resolution** | Keyed by JWT `sub`. Cache hit (60s TTL) uses cached user; else DB lookup by `auth0Id`; else provision via Auth0 userinfo and insert user + preferences. |
| **Placeholder refresh** | If user has placeholder identity, userinfo is fetched and user record updated when values differ. |
| **Outcome** | `req.user` set; request is authorized and passed to route handler. No per-resource or tier checks; all authenticated users have access to all features. |
