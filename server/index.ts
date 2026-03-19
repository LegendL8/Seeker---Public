import "dotenv/config";

import express, { type Request, type Response } from "express";
import { sql } from "drizzle-orm";
import pinoHttp from "pino-http";

import applicationsRouter from "./applications/routes";
import dashboardRouter from "./dashboard/routes";
import interviewsRouter from "./interviews/routes";
import notesRouter from "./notes/routes";
import resumesRouter from "./resumes/routes";
import { asyncHandler } from "./asyncHandler";
import { requireAuth } from "./auth/middleware";
import { env } from "./config";
import { db } from "./db";
import { AppError, errorHandler } from "./errors";
import { logger } from "./logger";
import { connectRedis } from "./redis";
import { globalApiRateLimiter } from "./rateLimit";
import { createPinoHttpGenReqId } from "./requestId";
import { securityHeaders, cors } from "./security";

const app = express();
const port = env.PORT;

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    genReqId: createPinoHttpGenReqId(),
  }),
);
app.use(securityHeaders);
app.use(cors);
app.use(express.json());

app.use("/api", globalApiRateLimiter);

app.get(
  "/api/v1/health",
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      await db.execute(sql`select 1`);
      res.json({ status: "ok", db: "connected" });
    } catch {
      throw new AppError("SERVICE_UNAVAILABLE", "db disconnected", 503);
    }
  }),
);

app.get(
  "/api/v1/me",
  asyncHandler(requireAuth),
  (req: Request, res: Response) => {
    const user = req.user!;
    res.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      subscriptionTier: user.subscriptionTier,
    });
  },
);

app.use("/api/v1/applications", applicationsRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/interviews", interviewsRouter);
app.use("/api/v1/notes", notesRouter);
app.use("/api/v1/resumes", resumesRouter);

app.use(errorHandler);

async function start(): Promise<void> {
  await connectRedis();
  logger.info("redis connected");

  app.listen(port, () => {
    logger.info({ port }, "server listening");
  });
}

start().catch((err: unknown) => {
  logger.error({ err }, "server failed to start");
  process.exit(1);
});
