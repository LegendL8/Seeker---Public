import { test, expect } from "@playwright/test";

/**
 * Process 2: Dashboard load. User opens / and sees dashboard metrics.
 */
test("dashboard load shows metrics or empty state", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Dashboard", level: 1 }),
  ).toBeVisible({ timeout: 10000 });
  await expect(
    page.getByText(/Total applications|Loading metrics|No applications yet/).first(),
  ).toBeVisible({ timeout: 5000 });
});
