import { test, expect } from "@playwright/test";

/**
 * Process 8: List interviews. Shown on application detail.
 */
test("list interviews on application detail", async ({ page }) => {
  await page.goto("/applications");
  const appLink = page.getByRole("link", { name: "Senior Software Engineer" }).first();
  await expect(appLink).toBeVisible({ timeout: 10000 });
  await appLink.click();
  await expect(page.getByRole("heading", { name: "Interviews", level: 3 })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("button", { name: "Add interview" })).toBeVisible();
});

/**
 * Process 9: Add interview. From application detail, add an interview.
 */
test("add interview", async ({ page }) => {
  await page.goto("/applications");
  const appLink = page.getByRole("link", { name: "Full Stack Developer" }).first();
  await expect(appLink).toBeVisible({ timeout: 10000 });
  await appLink.click();
  await page.getByRole("button", { name: "Add interview" }).click();
  await page.getByLabel(/interview type/i).selectOption("technical");
  await page.getByRole("button", { name: "Add interview" }).click();
  await expect(page.getByText("technical")).toBeVisible({ timeout: 5000 });
});

/**
 * Process 11: Delete interview. Delete button with confirm on application detail.
 */
test("delete interview", async ({ page }) => {
  await page.goto("/applications");
  const appLink = page.getByRole("link", { name: "Full Stack Developer" }).first();
  await expect(appLink).toBeVisible({ timeout: 10000 });
  await appLink.click();
  const deleteBtn = page.getByRole("button", { name: "Delete" }).first();
  await expect(deleteBtn).toBeVisible({ timeout: 10000 });
  page.on("dialog", (d) => d.accept());
  await deleteBtn.click();
  await expect(page.getByRole("heading", { name: "Full Stack Developer", level: 2 })).toBeVisible({ timeout: 5000 });
});
