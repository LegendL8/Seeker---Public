import type { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { eq } from "drizzle-orm";

import { AppError, AuthError } from "../errors";
import { env } from "../config";
import { db } from "../db";
import { users } from "../db/schema";
import { logger } from "../logger";
import type { User } from "./types";

const BEARER_PREFIX = "Bearer ";

const USER_CACHE_TTL_MS = 60_000;

const userCache = new Map<
  string,
  { user: User; expiresAt: number }
>();

function getCachedUser(sub: string): User | undefined {
  const entry = userCache.get(sub);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    userCache.delete(sub);
    return undefined;
  }
  return entry.user;
}

function setCachedUser(sub: string, user: User): void {
  userCache.set(sub, {
    user,
    expiresAt: Date.now() + USER_CACHE_TTL_MS,
  });
}

function getIssuerBaseUrl(): string {
  const url = env.AUTH0_ISSUER_BASE_URL;
  if (!url) return "";
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const issuerBase = getIssuerBaseUrl();
  if (!issuerBase) {
    throw new AppError(
      "AUTH_NOT_CONFIGURED",
      "Server auth not configured",
      501,
    );
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
    throw new AuthError("Missing or invalid Authorization header");
  }

  const token = authHeader.slice(BEARER_PREFIX.length).trim();
  if (!token) {
    throw new AuthError("Missing token");
  }

  try {
    const jwksUrl = `${issuerBase}/.well-known/jwks.json`;
    const JWKS = createRemoteJWKSet(new URL(jwksUrl));
    const verifyOptions: { issuer: string; audience?: string } = {
      issuer: issuerBase + "/",
    };
    if (env.AUTH0_AUDIENCE) {
      verifyOptions.audience = env.AUTH0_AUDIENCE;
    }
    const { payload } = await jwtVerify(token, JWKS, verifyOptions);
    const sub = payload.sub;
    if (!sub || typeof sub !== "string") {
      throw new AuthError("Invalid token claims");
    }

    let user: User | undefined = getCachedUser(sub);

    if (!user) {
      user = (
        await db.select().from(users).where(eq(users.auth0Id, sub)).limit(1)
      )[0];
      if (!user) {
        user = await ensureUserFromToken(token, sub, issuerBase);
        if (!user) {
          throw new AuthError("Could not create user from token");
        }
      }
      setCachedUser(sub, user);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.warn({ err }, "JWT verification failed");
    throw new AuthError("Invalid or expired token");
  }
}

async function ensureUserFromToken(
  accessToken: string,
  auth0Id: string,
  issuerBase: string,
): Promise<User | undefined> {
  const userinfoUrl = `${issuerBase}/userinfo`;
  let email: string;
  let displayName: string | null = null;

  try {
    const resp = await fetch(userinfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) {
      logger.warn(
        { status: resp.status, auth0Id },
        "Auth0 userinfo failed; provisioning from token sub only",
      );
      email = `${auth0Id.replace(/\|/g, "-")}@auth0.user`;
      displayName = null;
    } else {
      const body = (await resp.json()) as {
        email?: string;
        name?: string;
        sub?: string;
      };
      email =
        body.email ?? body.sub ?? `${auth0Id.replace(/\|/g, "-")}@auth0.user`;
      displayName = body.name ?? null;
    }
  } catch (err) {
    logger.warn({ err }, "Auth0 userinfo request failed");
    return undefined;
  }

  const [inserted] = await db
    .insert(users)
    .values({
      auth0Id,
      email,
      displayName,
      subscriptionTier: "free",
    })
    .returning();

  return inserted ?? undefined;
}
