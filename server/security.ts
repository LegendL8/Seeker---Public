import type { Request, Response, NextFunction } from "express";

import { env } from "./config";

/**
 * Sets security headers on every response (ARCHITECTURE: HSTS, X-Frame-Options,
 * X-Content-Type-Options, Referrer-Policy). HSTS only in production.
 */
export function securityHeaders(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
}

/**
 * CORS middleware: allow only the configured origin (ARCHITECTURE: strict, own domain).
 * Sets Access-Control-Allow-Origin when Origin matches; supports credentials.
 */
export function cors(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const origin = req.headers.origin;
  const allowed = env.ALLOWED_ORIGIN;

  if (origin === allowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
}
