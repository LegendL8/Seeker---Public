import type { Request, Response, NextFunction } from 'express';
import { asyncHandler } from './asyncHandler';

function mockReq(): Request {
  return {} as Request;
}

function mockRes(): Response {
  return {} as Response;
}

function mockNext(): NextFunction {
  return jest.fn();
}

describe('asyncHandler', () => {
  it('calls next with error when handler throws synchronously', async () => {
    const err = new Error('sync throw');
    const handler = jest.fn().mockImplementation(() => {
      throw err;
    });
    const wrapped = asyncHandler(handler);
    const next = mockNext();

    wrapped(mockReq(), mockRes(), next);

    await Promise.resolve();
    expect(next).toHaveBeenCalledWith(err);
  });

  it('calls next with error when handler returns rejected promise', async () => {
    const err = new Error('async reject');
    const handler = jest.fn().mockRejectedValue(err);
    const wrapped = asyncHandler(handler);
    const next = mockNext();

    wrapped(mockReq(), mockRes(), next);

    await Promise.resolve();

    expect(next).toHaveBeenCalledWith(err);
  });

  it('does not call next when handler resolves without error', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    const wrapped = asyncHandler(handler);
    const next = mockNext();

    wrapped(mockReq(), mockRes(), next);

    await Promise.resolve();

    expect(next).not.toHaveBeenCalled();
  });
});
