import express from "express";
import type { Server } from "http";

import type { User } from "./auth/types";
import { parseJobPostingUrl } from "./applications/parsePosting";
import applicationsRouter from "./applications/routes";
import {
  listApplications,
  listApplicationsByCursor,
} from "./applications/service";
import { errorHandler } from "./errors";

jest.mock("./applications/service", () => ({
  listApplications: jest.fn(),
  listApplicationsByCursor: jest.fn(),
  getApplicationById: jest.fn(),
  createApplication: jest.fn(),
  updateApplication: jest.fn(),
  deleteApplication: jest.fn(),
}));
jest.mock("./applications/parsePosting", () => ({
  parseJobPostingUrl: jest.fn(),
}));
jest.mock("./auth/middleware", () => ({
  requireAuth: (
    req: express.Request,
    res: express.Response,
    next: () => void,
  ) => {
    if (req.user) next();
    else
      res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Not authenticated",
        statusCode: 401,
      });
  },
}));

const mockUserId = "550e8400-e29b-41d4-a716-446655440001";
const mockUser: User = {
  id: mockUserId,
  auth0Id: "auth0|test",
  email: "test@example.com",
  displayName: null,
  subscriptionTier: "free",
  createdAt: new Date(),
  updatedAt: new Date(),
};
const mockItems = [
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    userId: mockUserId,
    jobTitle: "Engineer",
    status: "saved",
  },
];

async function listen(
  app: express.Express,
): Promise<{ server: Server; port: number }> {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const port = (server.address() as { port: number }).port;
      resolve({ server, port });
    });
  });
}

describe("GET /api/v1/applications", () => {
  let server: Server;
  let port: number;

  beforeAll(async () => {
    const app = express();
    app.use((req, _res, next) => {
      req.user = mockUser;
      next();
    });
    app.use("/api/v1/applications", applicationsRouter);
    const result = await listen(app);
    server = result.server;
    port = result.port;
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    (listApplications as jest.Mock).mockResolvedValue({
      items: mockItems,
      total: mockItems.length,
    });
    (listApplicationsByCursor as jest.Mock).mockResolvedValue({
      items: [],
      nextCursor: null,
    });
  });

  it("returns 200 and list when authenticated with page and limit", async () => {
    const res = await fetch(
      `http://127.0.0.1:${port}/api/v1/applications?page=1&limit=20`,
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);
    expect(body.total).toBe(mockItems.length);
    expect(listApplications).toHaveBeenCalledWith(mockUserId, 1, 20);
  });

  it("returns 401 when user is not set", async () => {
    const app = express();
    app.use("/api/v1/applications", applicationsRouter);
    const { server: s2, port: p2 } = await listen(app);
    const res = await fetch(
      `http://127.0.0.1:${p2}/api/v1/applications?page=1&limit=20`,
    );
    const body = await res.json();
    s2.close();

    expect(res.status).toBe(401);
    expect(body.error).toBe("UNAUTHORIZED");
  });
});

describe("POST /api/v1/applications/parse-posting", () => {
  let server: Server;
  let port: number;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = mockUser;
      next();
    });
    app.use("/api/v1/applications", applicationsRouter);
    app.use(errorHandler);
    const result = await listen(app);
    server = result.server;
    port = result.port;
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    const mock = parseJobPostingUrl as jest.Mock;
    mock.mockClear();
    mock.mockResolvedValue({
      jobTitle: "Engineer",
      companyName: "Acme",
      location: "Remote",
      jobPostingUrl: "https://www.linkedin.com/jobs/view/123",
    });
  });

  it("returns 200 and parsed result when body is valid", async () => {
    const res = await fetch(
      `http://127.0.0.1:${port}/api/v1/applications/parse-posting`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: "https://www.linkedin.com/jobs/view/123",
        }),
      },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.jobTitle).toBe("Engineer");
    expect(body.companyName).toBe("Acme");
    expect(body.location).toBe("Remote");
    expect(body.jobPostingUrl).toBe(
      "https://www.linkedin.com/jobs/view/123",
    );
    expect(parseJobPostingUrl).toHaveBeenCalledWith(
      "https://www.linkedin.com/jobs/view/123",
    );
  });

  it("returns 400 when url is invalid", async () => {
    const res = await fetch(
      `http://127.0.0.1:${port}/api/v1/applications/parse-posting`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "not-a-url" }),
      },
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("VALIDATION_ERROR");
    expect(parseJobPostingUrl).not.toHaveBeenCalled();
  });

  it("returns 401 when user is not set", async () => {
    const app = express();
    app.use(express.json());
    app.use("/api/v1/applications", applicationsRouter);
    const { server: s2, port: p2 } = await listen(app);
    const res = await fetch(
      `http://127.0.0.1:${p2}/api/v1/applications/parse-posting`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: "https://www.linkedin.com/jobs/view/123",
        }),
      },
    );
    const body = await res.json();
    s2.close();

    expect(res.status).toBe(401);
    expect(body.error).toBe("UNAUTHORIZED");
  });
});
