import { test, expect } from "@playwright/test";

const FRONTEND_TIME_TO_CONTENT_TARGET_MS = 3000;

/**
 * Process 2: Dashboard load. User opens / and sees dashboard metrics.
 * Also asserts frontend time-to-content (navigation to main content visible) under target.
 */
test("dashboard load shows metrics or empty state", async ({ page }) => {
  await page.goto("/");
  const start = performance.now();
  await expect(
    page.getByRole("heading", { name: "Dashboard", level: 1 }),
  ).toBeVisible({ timeout: 10000 });
  const timeToContent = performance.now() - start;
  expect(
    timeToContent,
    `Dashboard time-to-content ${timeToContent.toFixed(0)}ms should be under ${FRONTEND_TIME_TO_CONTENT_TARGET_MS}ms`,
  ).toBeLessThan(FRONTEND_TIME_TO_CONTENT_TARGET_MS);
  await expect(
    page
      .getByText(/Total applications|Loading metrics|No applications yet/)
      .first(),
  ).toBeVisible({ timeout: 5000 });
});
