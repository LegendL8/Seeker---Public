import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;

export function rateLimitHandler(_req: Request, res: Response): void {
  res.status(429).json({
    error: "RATE_LIMITED",
    message: "Too many requests",
    statusCode: 429,
  });
}

export const globalApiRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export function applicationsRateLimiter(): ReturnType<typeof rateLimit> {
  return rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: 60,
    keyGenerator: (req) => {
      const r = req as Request & { user?: { id: string } };
      return r.user?.id ?? r.ip ?? "unknown";
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
  });
}

export function resumesUploadRateLimiter(): ReturnType<typeof rateLimit> {
  return rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: 5,
    keyGenerator: (req) => {
      const r = req as Request & { user?: { id: string } };
      return r.user?.id ?? r.ip ?? "unknown";
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
  });
}
