import { test, expect } from "@playwright/test";

/**
 * Process 3: Applications list. User opens /applications.
 */
test("applications list loads", async ({ page }) => {
  await page.goto("/applications");
  await expect(
    page.getByRole("heading", { name: "Applications", level: 1 }),
  ).toBeVisible({ timeout: 10000 });
  await expect(
    page.getByRole("link", { name: "Add application" }),
  ).toBeVisible();
});

const FRONTEND_TIME_TO_CONTENT_TARGET_MS = 3000;

/**
 * Process 4: Application detail. User opens an application from the list.
 * Uses first row's job-title link (scoped to main) so we don't match nav links.
 * Also asserts frontend time-to-content (navigation to detail to title visible) under target.
 */
test("application detail loads when opening from list", async ({ page }) => {
  await page.goto("/applications");
  await expect(
    page.getByRole("heading", { name: "Applications", level: 1 }),
  ).toBeVisible({ timeout: 10000 });
  const firstAppLink = page
    .getByRole("main")
    .getByRole("list")
    .getByRole("listitem")
    .first()
    .getByRole("link")
    .first();
  await expect(firstAppLink).toBeVisible({ timeout: 10000 });
  const jobTitle = (await firstAppLink.textContent())?.trim() ?? "";
  await firstAppLink.click();
  const start = performance.now();
  await expect(
    page.getByRole("heading", { name: jobTitle, level: 1 }),
  ).toBeVisible({ timeout: 10000 });
  const timeToContent = performance.now() - start;
  expect(
    timeToContent,
    `Application detail time-to-content ${timeToContent.toFixed(0)}ms should be under ${FRONTEND_TIME_TO_CONTENT_TARGET_MS}ms`,
  ).toBeLessThan(FRONTEND_TIME_TO_CONTENT_TARGET_MS);
  await expect(
    page.getByRole("link", { name: "Edit", exact: true }),
  ).toBeVisible();
});

/**
 * Process 5: Add application. Submit form at /applications/new.
 * App redirects to list on success, not to detail.
 */
test("add application", async ({ page }) => {
  await page.goto("/applications/new");
  await expect(
    page.getByRole("heading", { name: "Add application", level: 1 }),
  ).toBeVisible({ timeout: 10000 });
  await page.getByLabel(/job title/i).fill("E2E Test Role");
  await page.getByRole("button", { name: "Add application" }).click();
  await expect(page).toHaveURL("/applications", { timeout: 10000 });
  await expect(
    page.getByRole("heading", { name: "Applications", level: 1 }),
  ).toBeVisible({ timeout: 10000 });
  await expect(
    page.getByRole("link", { name: "E2E Test Role" }).first(),
  ).toBeVisible({ timeout: 5000 });
});

/**
 * Process 6: Edit application. Create app (redirect to list), open from list, edit, save.
 */
test("edit application", async ({ page }) => {
  await page.goto("/applications/new");
  await page.getByLabel(/job title/i).fill("E2E Edit Target");
  await page.getByRole("button", { name: "Add application" }).click();
  await expect(page).toHaveURL("/applications", { timeout: 10000 });
  const editTargetLink = page
    .getByRole("link", { name: "E2E Edit Target", exact: true })
    .first();
  await expect(editTargetLink).toBeVisible({ timeout: 10000 });
  await editTargetLink.click();
  await page.getByRole("link", { name: "Edit", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Edit application", level: 1 }),
  ).toBeVisible({ timeout: 10000 });
  await page.getByLabel(/job title/i).fill("E2E Edit Target (Saved)");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/applications\/[^/]+$/, { timeout: 10000 });
  await expect(
    page.getByRole("heading", { name: "E2E Edit Target (Saved)", level: 1 }),
  ).toBeVisible();
});

/**
 * Process 7: Delete application. Create app (redirect to list), open from list, delete.
 */
test("delete application", async ({ page }) => {
  await page.goto("/applications/new");
  await page.getByLabel(/job title/i).fill("To Be Deleted");
  await page.getByRole("button", { name: "Add application" }).click();
  await expect(page).toHaveURL("/applications", { timeout: 10000 });
  const toBeDeletedLink = page
    .getByRole("link", { name: "To Be Deleted" })
    .first();
  await expect(toBeDeletedLink).toBeVisible({ timeout: 10000 });
  await toBeDeletedLink.click();
  await expect(
    page.getByRole("heading", { name: "To Be Deleted", level: 1 }),
  ).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: "Delete application" }).click();
  await page.getByRole("button", { name: "Yes, delete" }).click();
  await expect(page).toHaveURL("/applications", { timeout: 10000 });
  await expect(
    page.getByRole("heading", { name: "Applications", level: 1 }),
  ).toBeVisible();
});
