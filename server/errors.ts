import type { ErrorRequestHandler, Request } from "express";
import type { Logger } from "pino";

import { logger } from "./logger";

function logForRequest(req: Request): Logger {
  if (req.log !== undefined) {
    return req.log;
  }
  return logger;
}

export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class AuthError extends AppError {
  constructor(message: string) {
    super("UNAUTHORIZED", message, 401);
    this.name = "AuthError";
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code = "VALIDATION_ERROR") {
    super(code, message, 400);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code = "NOT_FOUND") {
    super(code, message, 404);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, code = "FORBIDDEN") {
    super(code, message, 403);
    this.name = "ForbiddenError";
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const reqLog = logForRequest(req);

  if (isAppError(err)) {
    reqLog.warn(
      { err, code: err.code, statusCode: err.statusCode },
      err.message,
    );
    res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  const multerErr = err as { code?: string; message?: string };
  if (multerErr.code === "LIMIT_FILE_SIZE") {
    reqLog.warn({ code: multerErr.code }, "Upload rejected: file too large");
    res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "File too large. Maximum size is 5MB.",
      statusCode: 400,
    });
    return;
  }
  if (multerErr.code === "LIMIT_UNEXPECTED_FILE") {
    reqLog.warn(
      { code: multerErr.code },
      "Upload rejected: unexpected file field",
    );
    res.status(400).json({
      error: "VALIDATION_ERROR",
      message: 'Unexpected file field. Use "file" for the upload.',
      statusCode: 400,
    });
    return;
  }

  reqLog.error({ err }, "Unhandled error");
  res.status(500).json({
    error: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
    statusCode: 500,
  });
};
