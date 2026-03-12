import type { Request, Response } from 'express';
import {
  applicationsRateLimiter,
  globalApiRateLimiter,
  rateLimitHandler,
} from './rateLimit';

function mockReq(): Request {
  return { ip: '127.0.0.1' } as Request;
}

function mockRes(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res;
}

describe('rateLimitHandler', () => {
  it('sends 429 with standard error format', () => {
    const res = mockRes();
    rateLimitHandler(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      error: 'RATE_LIMITED',
      message: 'Too many requests',
      statusCode: 429,
    });
  });
});

describe('globalApiRateLimiter', () => {
  it('is a function (middleware)', () => {
    expect(typeof globalApiRateLimiter).toBe('function');
  });
});

describe('applicationsRateLimiter', () => {
  it('returns middleware function', () => {
    const middleware = applicationsRateLimiter();
    expect(typeof middleware).toBe('function');
  });
});
