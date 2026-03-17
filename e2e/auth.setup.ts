import { test as setup, expect } from "@playwright/test";
import path from "path";

const AUTH_FILE = path.join(__dirname, ".auth", "user.json");

/**
 * Process 1: Sign in. Performs real Auth0 login and saves storage state
 * so dependent tests run already authenticated (one login per run).
 * Requires E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD in env.
 */
setup("sign in and save session", async ({ page }) => {
  const email = process.env.E2E_AUTH_EMAIL;
  const password = process.env.E2E_AUTH_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD must be set for E2E. See TESTING_PLAN.md.",
    );
  }

  await page.goto("/auth/login");
  await page.waitForURL(/auth0\.com/, { timeout: 15000 });

  const usernameInput = page
    .locator('input[name="username"], input[name="email"], input[type="email"]')
    .first();
  await usernameInput.fill(email);
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  const passwordInput = page.locator(
    'input[name="password"], input[type="password"]',
  );
  await passwordInput.waitFor({ state: "visible", timeout: 10000 });
  await passwordInput.fill(password);
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  const acceptBtn = page.getByRole("button", { name: "Accept" });
  await Promise.race([
    page.waitForURL(/(localhost|127\.0\.0\.1):3000/, { timeout: 15000 }),
    acceptBtn.waitFor({ state: "visible", timeout: 10000 }),
  ]).catch(() => {});

  if (await acceptBtn.isVisible().catch(() => false)) {
    await acceptBtn.click();
  }

  try {
    await page.waitForURL(/(localhost|127\.0\.0\.1):3000/, { timeout: 20000 });
  } catch {
    const errEl = page
      .getByText(/wrong email or password|invalid connection|access denied/i)
      .first();
    const hasError = await errEl.isVisible().catch(() => false);
    if (hasError) {
      const msg = await errEl.textContent();
      throw new Error(
        `Auth0 error: ${msg ?? "unknown"}. Check E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD.`,
      );
    }
    throw new Error(
      "No redirect to app after login. In Auth0: Application > Allowed Callback URLs must include http://localhost:3000/auth/callback. Run: npm run test:e2e -- --headed to watch the browser.",
    );
  }

  await expect(
    page
      .getByRole("heading", { name: /dashboard/i })
      .or(page.getByRole("link", { name: "Dashboard" }))
      .first(),
  ).toBeVisible({ timeout: 10000 });

  await page.context().storageState({ path: AUTH_FILE });
});
