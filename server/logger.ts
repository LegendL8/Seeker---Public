import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const redactPaths = [
  "req.headers.authorization",
  "req.headers.cookie",
  'req.headers["set-cookie"]',
  'req.headers["x-middleware-set-cookie"]',
  'res.headers["set-cookie"]',
];

export const logger = pino({
  redact: {
    paths: redactPaths,
    censor: "[Redacted]",
  },
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }
    : {}),
});
