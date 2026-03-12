import type { User } from './auth/types';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
