import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";

/** Max length for inbound X-Request-Id / X-Correlation-Id (after trim). */
const MAX_INBOUND_REQUEST_ID_LENGTH = 128;

/** Letters, digits, hyphen, underscore, period, colon — no whitespace. */
const SAFE_REQUEST_ID_PATTERN = /^[0-9A-Za-z._:-]+$/;

export function parseSafeIncomingRequestId(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_INBOUND_REQUEST_ID_LENGTH) {
    return undefined;
  }
  if (!SAFE_REQUEST_ID_PATTERN.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

function headerString(
  headers: Request["headers"],
  lowerName: string,
): string | undefined {
  const v = headers[lowerName];
  if (typeof v === "string") {
    return v;
  }
  if (Array.isArray(v) && v.length > 0) {
    const first = v[0];
    if (typeof first === "string") {
      return first;
    }
  }
  return undefined;
}

/**
 * Resolves canonical request id: valid X-Request-Id, else valid
 * X-Correlation-Id, else new UUID. Sets response X-Request-Id.
 */
export function resolveRequestId(req: Request, res: Response): string {
  const fromRequestId = headerString(req.headers, "x-request-id");
  const parsedRequest =
    fromRequestId !== undefined
      ? parseSafeIncomingRequestId(fromRequestId)
      : undefined;
  if (parsedRequest !== undefined) {
    res.setHeader("X-Request-Id", parsedRequest);
    return parsedRequest;
  }

  const fromCorrelation = headerString(req.headers, "x-correlation-id");
  const parsedCorrelation =
    fromCorrelation !== undefined
      ? parseSafeIncomingRequestId(fromCorrelation)
      : undefined;
  if (parsedCorrelation !== undefined) {
    res.setHeader("X-Request-Id", parsedCorrelation);
    return parsedCorrelation;
  }

  const id = randomUUID();
  res.setHeader("X-Request-Id", id);
  return id;
}

/** Factory for pino-http `genReqId` (signature includes `res` for header echo). */
export function createPinoHttpGenReqId(): (
  req: Request,
  res: Response,
) => string {
  return (req: Request, res: Response) => resolveRequestId(req, res);
}
