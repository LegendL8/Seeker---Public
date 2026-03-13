import type { Request, Response, NextFunction } from "express";
import {
  AppError,
  AuthError,
  ValidationError,
  NotFoundError,
  isAppError,
  errorHandler,
} from "./errors";

jest.mock("./logger", () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

function mockRes(): Response {
  const res = {} as Response;
  res.headersSent = false;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res;
}

function mockNext(): NextFunction {
  return jest.fn();
}

describe("error classes", () => {
  it("AppError sets code, message, statusCode and extends Error", () => {
    const err = new AppError("CODE", "msg", 400);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe("CODE");
    expect(err.message).toBe("msg");
    expect(err.statusCode).toBe(400);
    expect(err.name).toBe("AppError");
  });

  it("AuthError sets UNAUTHORIZED and 401", () => {
    const err = new AuthError("bad token");
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.message).toBe("bad token");
    expect(err.statusCode).toBe(401);
    expect(err.name).toBe("AuthError");
  });

  it("ValidationError sets default code and 400", () => {
    const err = new ValidationError("invalid input");
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.statusCode).toBe(400);
  });

  it("ValidationError accepts custom code", () => {
    const err = new ValidationError("bad", "CUSTOM");
    expect(err.code).toBe("CUSTOM");
  });

  it("NotFoundError sets default code and 404", () => {
    const err = new NotFoundError("not found");
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.statusCode).toBe(404);
  });
});

describe("isAppError", () => {
  it("returns true for AppError and subclasses", () => {
    expect(isAppError(new AppError("X", "y", 400))).toBe(true);
    expect(isAppError(new AuthError("z"))).toBe(true);
    expect(isAppError(new ValidationError("a"))).toBe(true);
  });

  it("returns false for generic Error and non-errors", () => {
    expect(isAppError(new Error("generic"))).toBe(false);
    expect(isAppError("string")).toBe(false);
    expect(isAppError(null)).toBe(false);
  });
});

describe("errorHandler", () => {
  it("sends AppError as JSON with correct status and does not call next", () => {
    const err = new AuthError("unauthorized");
    const req = {} as Request;
    const res = mockRes();
    const next = mockNext();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "UNAUTHORIZED",
      message: "unauthorized",
      statusCode: 401,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("sends 500 and INTERNAL_ERROR for unknown errors", () => {
    const err = new Error("generic");
    const req = {} as Request;
    const res = mockRes();
    const next = mockNext();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      statusCode: 500,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next(err) when headersSent is true", () => {
    const err = new AuthError("too late");
    const req = {} as Request;
    const res = mockRes();
    res.headersSent = true;
    const next = mockNext();

    errorHandler(err, req, res, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
  });
});
