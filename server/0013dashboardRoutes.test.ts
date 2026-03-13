import express from "express";
import type { Server } from "http";

import type { User } from "./auth/types";
import { getMetrics } from "./dashboard/service";
import dashboardRouter from "./dashboard/routes";

jest.mock("./dashboard/service", () => ({
  getMetrics: jest.fn(),
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
const mockMetrics = {
  totalApplications: 2,
  applicationsByStatus: {
    saved: 0,
    applied: 1,
    interviewing: 1,
    offer: 0,
    rejected: 0,
  },
  interviewRate: 0.5,
  activeApplications: 2,
  offersReceived: 0,
  rejectionsReceived: 0,
};

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

describe("GET /api/v1/dashboard/metrics", () => {
  let server: Server;
  let port: number;

  beforeAll(async () => {
    const app = express();
    app.use((req, _res, next) => {
      req.user = mockUser;
      next();
    });
    app.use("/api/v1/dashboard", dashboardRouter);
    const result = await listen(app);
    server = result.server;
    port = result.port;
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    (getMetrics as jest.Mock).mockResolvedValue(mockMetrics);
  });

  it("returns 200 and metrics in data when authenticated", async () => {
    const res = await fetch(
      `http://127.0.0.1:${port}/api/v1/dashboard/metrics`,
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ data: mockMetrics });
    expect(getMetrics).toHaveBeenCalledWith(mockUserId);
  });

  it("returns 401 when user is not set", async () => {
    const app = express();
    app.use("/api/v1/dashboard", dashboardRouter);
    const { server: s2, port } = await listen(app);
    const res = await fetch(
      `http://127.0.0.1:${port}/api/v1/dashboard/metrics`,
    );
    const body = await res.json();
    s2.close();

    expect(res.status).toBe(401);
    expect(body.error).toBe("UNAUTHORIZED");
  });
});
