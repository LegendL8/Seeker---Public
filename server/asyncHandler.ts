import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps async route handlers so rejections and thrown errors are passed to next(err)
 * and handled by the central error middleware.
 */
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      Promise.resolve(fn(req, res, next)).catch(next);
    } catch (err) {
      next(err);
    }
  };
}
