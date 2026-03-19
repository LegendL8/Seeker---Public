import type { Logger } from "pino";
import type { User } from "./auth/types";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      /** Set by pino-http after request id is assigned. */
      id?: string;
      /** Child logger from pino-http; includes request bindings. */
      log?: Logger;
    }
  }
}

export {};
