import { defineConfig, devices } from "@playwright/test";
import path from "path";

const AUTH_FILE = path.join(__dirname, "e2e", ".auth", "user.json");

/**
 * E2E tests run against the local stack: Next.js (3000), Express (3001),
 * Postgres, Redis. Start the stack before running test:e2e (e.g. docker compose
 * up -d postgres redis; npm run dev; npm run dev:server in another terminal).
 * Seed with seed.active; set SEED_ACTIVE_AUTH0_ID and E2E_AUTH_EMAIL /
 * E2E_AUTH_PASSWORD (see TESTING_PLAN.md).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: AUTH_FILE,
      },
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
});
