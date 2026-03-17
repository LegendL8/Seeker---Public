import type { Request, Response, NextFunction } from "express";

jest.mock("./config", () => ({
  env: { ALLOWED_ORIGIN: "https://app.example.com" },
}));

import { securityHeaders, cors } from "./security";

function mockRes(): Response {
  const res = {} as Response;
  res.setHeader = jest.fn().mockReturnThis();
  res.sendStatus = jest.fn().mockReturnThis();
  return res;
}

function mockNext(): NextFunction {
  return jest.fn();
}

describe("securityHeaders", () => {
  it("sets X-Frame-Options, X-Content-Type-Options, and Referrer-Policy", () => {
    const res = mockRes();
    const next = mockNext();
    securityHeaders({} as Request, res, next);
    expect(res.setHeader).toHaveBeenCalledWith("X-Frame-Options", "DENY");
    expect(res.setHeader).toHaveBeenCalledWith(
      "X-Content-Type-Options",
      "nosniff",
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      "Referrer-Policy",
      "no-referrer",
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("does not set HSTS when NODE_ENV is not production", () => {
    const env = process.env as NodeJS.ProcessEnv & { NODE_ENV?: string };
    const orig = env.NODE_ENV;
    env.NODE_ENV = "development";
    const res = mockRes();
    const next = mockNext();
    securityHeaders({} as Request, res, next);
    expect(res.setHeader).not.toHaveBeenCalledWith(
      "Strict-Transport-Security",
      expect.any(String),
    );
    env.NODE_ENV = orig;
  });

  it("sets HSTS when NODE_ENV is production", () => {
    const env = process.env as NodeJS.ProcessEnv & { NODE_ENV?: string };
    const orig = env.NODE_ENV;
    env.NODE_ENV = "production";
    const res = mockRes();
    const next = mockNext();
    securityHeaders({} as Request, res, next);
    expect(res.setHeader).toHaveBeenCalledWith(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
    env.NODE_ENV = orig;
  });
});

describe("cors", () => {
  it("sets Allow-Origin and Allow-Credentials when Origin matches allowed", () => {
    const req = {
      method: "GET",
      headers: { origin: "https://app.example.com" },
    } as Request;
    const res = mockRes();
    const next = mockNext();
    cors(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Origin",
      "https://app.example.com",
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Credentials",
      "true",
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, DELETE, OPTIONS",
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.sendStatus).not.toHaveBeenCalled();
  });

  it("does not set Allow-Origin or Allow-Credentials when Origin does not match", () => {
    const req = {
      method: "GET",
      headers: { origin: "https://other.example.com" },
    } as Request;
    const res = mockRes();
    const next = mockNext();
    cors(req, res, next);
    expect(res.setHeader).not.toHaveBeenCalledWith(
      "Access-Control-Allow-Origin",
      expect.any(String),
    );
    expect(res.setHeader).not.toHaveBeenCalledWith(
      "Access-Control-Allow-Credentials",
      expect.any(String),
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, DELETE, OPTIONS",
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("responds 204 to OPTIONS and does not call next", () => {
    const req = {
      method: "OPTIONS",
      headers: { origin: "https://app.example.com" },
    } as Request;
    const res = mockRes();
    const next = mockNext();
    cors(req, res, next);
    expect(res.sendStatus).toHaveBeenCalledWith(204);
    expect(next).not.toHaveBeenCalled();
  });

  it("sets Allow-Methods and Allow-Headers on every response", () => {
    const req = {
      method: "POST",
      headers: {},
    } as Request;
    const res = mockRes();
    const next = mockNext();
    cors(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, DELETE, OPTIONS",
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    expect(next).toHaveBeenCalledTimes(1);
  });
});
