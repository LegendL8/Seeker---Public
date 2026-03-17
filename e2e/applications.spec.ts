import { test, expect } from "@playwright/test";

/**
 * Process 3: Applications list. User opens /applications.
 */
test("applications list loads", async ({ page }) => {
  await page.goto("/applications");
  await expect(
    page.getByRole("heading", { name: "Applications", level: 2 }),
  ).toBeVisible({ timeout: 10000 });
  await expect(
    page.getByRole("link", { name: "Add application" }),
  ).toBeVisible();
});

/**
 * Process 4: Application detail. User opens an application from the list.
 */
test("application detail loads when opening from list", async ({ page }) => {
  await page.goto("/applications");
  await expect(page.getByRole("heading", { name: "Applications", level: 2 })).toBeVisible({ timeout: 10000 });
  const firstAppLink = page.getByRole("link", { name: "Senior Software Engineer" }).first();
  await expect(firstAppLink).toBeVisible({ timeout: 5000 });
  await firstAppLink.click();
  await expect(
    page.getByRole("heading", { name: "Senior Software Engineer", level: 2 }),
  ).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("link", { name: "Edit" })).toBeVisible();
});

/**
 * Process 5: Add application. Submit form at /applications/new.
 */
test("add application", async ({ page }) => {
  await page.goto("/applications/new");
  await expect(page.getByRole("heading", { name: "Add application", level: 2 })).toBeVisible({ timeout: 10000 });
  await page.getByLabel(/job title/i).fill("E2E Test Role");
  await page.getByRole("button", { name: "Add application" }).click();
  await expect(page).toHaveURL(/\/applications\/[^/]+$/, { timeout: 10000 });
  await expect(page.getByRole("heading", { name: "E2E Test Role", level: 2 })).toBeVisible({ timeout: 10000 });
});

/**
 * Process 6: Edit application. Open edit form and save.
 */
test("edit application", async ({ page }) => {
  await page.goto("/applications/new");
  await page.getByLabel(/job title/i).fill("E2E Edit Target");
  await page.getByRole("button", { name: "Add application" }).click();
  await expect(page).toHaveURL(/\/applications\/[^/]+$/, { timeout: 10000 });
  await page.getByRole("link", { name: "Edit" }).click();
  await expect(page.getByRole("heading", { name: "Edit application", level: 2 })).toBeVisible({ timeout: 10000 });
  await page.getByLabel(/job title/i).fill("E2E Edit Target (Saved)");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/applications\/[^/]+$/, { timeout: 10000 });
  await expect(page.getByRole("heading", { name: "E2E Edit Target (Saved)", level: 2 })).toBeVisible();
});

/**
 * Process 7: Delete application. Open detail, confirm delete.
 */
test("delete application", async ({ page }) => {
  await page.goto("/applications/new");
  await page.getByLabel(/job title/i).fill("To Be Deleted");
  await page.getByRole("button", { name: "Add application" }).click();
  await expect(page).toHaveURL(/\/applications\/[^/]+$/, { timeout: 10000 });
  await expect(page.getByRole("heading", { name: "To Be Deleted", level: 2 })).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: "Delete application" }).click();
  await page.getByRole("button", { name: "Yes, delete" }).click();
  await expect(page).toHaveURL("/applications", { timeout: 10000 });
  await expect(page.getByRole("heading", { name: "Applications", level: 2 })).toBeVisible();
});
