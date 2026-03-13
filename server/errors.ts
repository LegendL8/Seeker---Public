import type { ErrorRequestHandler } from "express";
import { logger } from "./logger";

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

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (isAppError(err)) {
    logger.warn(
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
    res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "File too large. Maximum size is 5MB.",
      statusCode: 400,
    });
    return;
  }
  if (multerErr.code === "LIMIT_UNEXPECTED_FILE") {
    res.status(400).json({
      error: "VALIDATION_ERROR",
      message: 'Unexpected file field. Use "file" for the upload.',
      statusCode: 400,
    });
    return;
  }

  logger.error({ err }, "Unhandled error");
  res.status(500).json({
    error: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
    statusCode: 500,
  });
};
