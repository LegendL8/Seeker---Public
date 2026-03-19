import { test, expect } from "@playwright/test";

/**
 * Process 8: List interviews. Shown on application detail.
 */
test("list interviews on application detail", async ({ page }) => {
  await page.goto("/applications");
  await expect(
    page.getByRole("heading", { name: "Applications", level: 1 }),
  ).toBeVisible({ timeout: 10000 });
  const appLink = page
    .getByRole("main")
    .getByRole("list")
    .getByRole("listitem")
    .first()
    .getByRole("link")
    .first();
  await expect(appLink).toBeVisible({ timeout: 10000 });
  await appLink.click();
  await expect(
    page.getByRole("heading", { name: "Interviews", level: 3 }),
  ).toBeVisible({ timeout: 10000 });
  await expect(
    page.getByRole("button", { name: "Add interview" }),
  ).toBeVisible();
});

/**
 * Process 9: Add interview. From application detail, add an interview.
 */
test("add interview", async ({ page }) => {
  await page.goto("/applications");
  await expect(
    page.getByRole("heading", { name: "Applications", level: 1 }),
  ).toBeVisible({ timeout: 10000 });
  const appLink = page
    .getByRole("main")
    .getByRole("list")
    .getByRole("listitem")
    .first()
    .getByRole("link")
    .first();
  await expect(appLink).toBeVisible({ timeout: 10000 });
  await appLink.click();
  await expect(
    page.getByRole("heading", { name: "Interviews", level: 3 }),
  ).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: "Add interview" }).click();
  await page.getByLabel("Type").selectOption("technical");
  await page
    .locator("form")
    .getByRole("button", { name: "Add interview" })
    .click();
  await expect(page.getByText("technical")).toBeVisible({ timeout: 5000 });
});

/**
 * Process 11: Delete interview. Delete button with confirm on application detail.
 */
test("delete interview", async ({ page }) => {
  await page.goto("/applications");
  await expect(
    page.getByRole("heading", { name: "Applications", level: 1 }),
  ).toBeVisible({ timeout: 10000 });
  const appLink = page
    .getByRole("main")
    .getByRole("list")
    .getByRole("listitem")
    .first()
    .getByRole("link")
    .first();
  await expect(appLink).toBeVisible({ timeout: 10000 });
  const jobTitle = (await appLink.textContent())?.trim() ?? "";
  await appLink.click();
  await expect(
    page.getByRole("heading", { name: "Interviews", level: 3 }),
  ).toBeVisible({ timeout: 10000 });
  const deleteBtn = page.getByRole("button", { name: "Delete" }).first();
  await expect(deleteBtn).toBeVisible({ timeout: 10000 });
  page.on("dialog", (d) => d.accept());
  await deleteBtn.click();
  await expect(
    page.getByRole("heading", { name: jobTitle, level: 1 }),
  ).toBeVisible({ timeout: 5000 });
});
