# Seeker — System Architecture Diagram

This diagram reflects the authenticated request flow: auth decision, API layer, services, and data storage. Style matches the reference visualization.

```mermaid
flowchart TB
  subgraph AUTH[" "]
    direction TB
    LR[Login Request] --> WHO{"Who is this user?"}
    WHO -->|Valid| OK1[Identity Confirmed]
    OK1 --> OK2[Grant Access]
    WHO -->|Invalid| FAIL1[Identity Not Confirmed]
    FAIL1 --> FAIL2[Reject with 401 Unauthorized]
  end

  OK2 --> ENTER[Enter System]
  ENTER --> GATEWAY[API Gateway]

  subgraph APILAYER["API LAYER"]
    direction TB
    GATEWAY --> APP_API[Applications API]
    GATEWAY --> INT_API[Interviews API]
    GATEWAY --> NOTES_API[Notes API]
    GATEWAY --> DASH_API[Dashboard API]
    GATEWAY --> RES_API[Resumes API]
  end

  subgraph SERVICES["SERVICES"]
    direction TB
    APP_SVC[Applications Service]
    INT_SVC[Interviews Service]
    NOTES_SVC[Notes Service]
    DASH_SVC[Dashboard Service]
    RES_SVC[Resumes Service]
  end

  APP_API --> APP_SVC
  INT_API --> INT_SVC
  NOTES_API --> NOTES_SVC
  DASH_API --> DASH_SVC
  RES_API --> RES_SVC

  subgraph DATA["DATA STORAGE"]
    direction TB
    PG[(PostgreSQL)]
    REDIS[(Redis)]
    R2[(Cloudflare R2)]
  end

  APP_SVC --> PG
  INT_SVC --> PG
  NOTES_SVC --> PG
  DASH_SVC --> REDIS
  DASH_SVC --> PG
  RES_SVC --> PG
  RES_SVC --> R2
```

## Layer summary

| Layer | Components |
|-------|------------|
| **Auth** | Login request (Auth0), JWT verification; valid path grants access, invalid path returns 401. |
| **API Gateway** | Express server; routes to feature APIs under `/api/v1/`. |
| **API Layer** | Applications, Interviews, Notes, Dashboard, Resumes. |
| **Services** | Feature services (applications, interviews, notes, dashboard, resumes); dashboard uses cache. |
| **Data Storage** | PostgreSQL (users, applications, companies, interviews, notes, resumes metadata); Redis (dashboard metrics); Cloudflare R2 (resume files). |
